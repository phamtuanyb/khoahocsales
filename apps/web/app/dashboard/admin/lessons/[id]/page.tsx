'use client';

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { LoadingScreen } from '@/components/loading-screen';
import { ApiError } from '@/lib/api-client';
import { adminApi, type AdminLesson, uploadFile } from '@/lib/admin-api';
import { isDirectVideoFile, normalizeVideoUrl } from '@/lib/video-url';

export default function AdminLessonEditorPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const [lesson, setLesson] = useState<AdminLesson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [moduleInfo, setModuleInfo] = useState<{ title: string; courseId: string } | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    adminApi
      .getLesson(id)
      .then((l) => {
        if (!mounted) return;
        setLesson(l);
        setVideoUrl(l.videoUrl ?? '');
        // Backend trả nested module + course nhưng AdminLesson type không expose
        // — coerce theo any để lấy nhanh cho breadcrumb.
        const raw = l as unknown as {
          module?: { title?: string; courseId?: string };
        };
        if (raw.module?.title && raw.module.courseId) {
          setModuleInfo({ title: raw.module.title, courseId: raw.module.courseId });
        }
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Lỗi tải'));
    return () => {
      mounted = false;
    };
  }, [id]);

  async function handleSave(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!lesson) return;
    setSaving(true);
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      const updated = await adminApi.updateLesson(lesson.id, {
        title: String(data.get('title') ?? '').trim(),
        content: String(data.get('content') ?? '').trim(),
        // Dùng state videoUrl thay vì FormData để upload-then-save không cần input value sync.
        videoUrl: videoUrl.trim() || null,
        order: Number(data.get('order') ?? lesson.order),
      });
      setLesson(updated);
      setVideoUrl(updated.videoUrl ?? '');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  }

  // Upload file video lên server → set URL local vào ô input để admin "Lưu thay đổi".
  async function handleVideoUpload(e: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const result = await uploadFile<{ url: string; size: number; mimetype: string }>(
        '/admin/uploads',
        file,
      );
      setVideoUrl(result.url);
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : 'Upload thất bại');
    } finally {
      setUploading(false);
      if (videoFileRef.current) videoFileRef.current.value = '';
    }
  }

  async function handleDelete(): Promise<void> {
    if (!lesson) return;
    if (!confirm(`Xóa bài "${lesson.title}"?`)) return;
    try {
      await adminApi.deleteLesson(lesson.id);
      router.push(`/dashboard/admin/courses/${moduleInfo?.courseId ?? ''}`);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Lỗi');
    }
  }

  if (error && !lesson) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
          ⚠ {error}
        </div>
        <Link href="/dashboard/admin/courses" className="mkt-btn-secondary inline-flex">
          ← Về danh sách
        </Link>
      </div>
    );
  }
  if (!lesson) return <LoadingScreen label="Đang tải bài học" />;

  return (
    <div className="space-y-6">
      <div className="text-xs text-sky">
        <Link href="/dashboard/admin/courses" className="hover:text-orange">
          Khóa học
        </Link>
        {moduleInfo && (
          <>
            <span className="mx-2">/</span>
            <Link
              href={`/dashboard/admin/courses/${moduleInfo.courseId}`}
              className="hover:text-orange"
            >
              {moduleInfo.title}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-white">{lesson.title}</span>
      </div>

      {error && (
        <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
          ⚠ {error}
        </div>
      )}

      <form onSubmit={handleSave} className="mkt-card space-y-4 p-6">
        <h2 className="text-h2-mkt-sm">
          <span className="mkt-pill-orange !text-sm">SỬA BÀI HỌC</span>
        </h2>

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Tiêu đề bài học">
            <input
              name="title"
              defaultValue={lesson.title}
              required
              minLength={2}
              className="mkt-input"
            />
          </Field>
          <Field label="Thứ tự trong mô-đun (order)">
            <input
              name="order"
              type="number"
              defaultValue={lesson.order}
              min={0}
              className="mkt-input"
            />
          </Field>
        </div>

        <Field label="Video bài học (URL hoặc upload file)">
          <div className="flex flex-col gap-2 md:flex-row">
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... · Google Drive · Vimeo · Loom"
              className="mkt-input flex-1"
            />
            <label
              className={`mkt-btn-secondary cursor-pointer whitespace-nowrap !text-sm ${
                uploading ? 'pointer-events-none opacity-60' : ''
              }`}
            >
              {uploading ? '⏳ Đang upload...' : '📤 Upload từ máy'}
              <input
                ref={videoFileRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska"
                onChange={handleVideoUpload}
                disabled={uploading}
                hidden
              />
            </label>
            {videoUrl && (
              <button
                type="button"
                onClick={() => setVideoUrl('')}
                className="rounded-pill bg-pink/20 px-3 py-1 text-xs font-bold text-pink hover:bg-pink/30"
              >
                Xóa
              </button>
            )}
          </div>
          <div className="mt-1 space-y-1 text-[10px] text-sky">
            <p>
              💡 Hỗ trợ auto-convert: YouTube <code className="text-orange">/watch?v=</code> hoặc{' '}
              <code className="text-orange">youtu.be/</code>, Google Drive share link, Vimeo, Loom.
            </p>
            <p>📤 Upload file MP4/WebM/MOV/AVI/MKV — tối đa 200MB.</p>
            {uploadError && <p className="text-pink">⚠ {uploadError}</p>}
          </div>

          {/* Preview live */}
          {videoUrl && (
            <div className="mt-3 overflow-hidden rounded-xl border border-sky/30 bg-navy-deep">
              <div className="aspect-video w-full">
                {isDirectVideoFile(videoUrl) ? (
                  <video src={videoUrl} controls preload="metadata" className="h-full w-full" />
                ) : (
                  <iframe
                    src={normalizeVideoUrl(videoUrl)}
                    className="h-full w-full"
                    title="Preview"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}
              </div>
            </div>
          )}
        </Field>

        <Field label="Nội dung bài học (markdown / plain text, các đoạn cách nhau bằng dòng trống)">
          <textarea
            name="content"
            defaultValue={lesson.content}
            required
            rows={16}
            className="mkt-input font-mono text-xs leading-relaxed"
          />
        </Field>

        <div className="flex flex-wrap justify-between gap-2">
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-pill bg-pink/20 px-4 py-2 text-xs font-bold text-pink hover:bg-pink/30"
          >
            🗑 Xóa bài học
          </button>
          <button
            type="submit"
            disabled={saving}
            className="mkt-btn-primary !text-sm disabled:opacity-60"
          >
            {saving ? 'Đang lưu...' : '💾 Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-bold uppercase tracking-widest text-sky">{label}</span>
      {children}
    </label>
  );
}
