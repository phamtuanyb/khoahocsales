'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { LoadingScreen } from '@/components/loading-screen';
import { ApiError } from '@/lib/api-client';
import { adminApi, type AdminCourse, type AdminDepartment, type AdminModule } from '@/lib/admin-api';

export default function AdminCourseEditorPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const courseId = params?.id;
  const [course, setCourse] = useState<AdminCourse | null>(null);
  const [depts, setDepts] = useState<AdminDepartment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savingCourse, setSavingCourse] = useState(false);

  // Module form
  const [moduleFormOpen, setModuleFormOpen] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleDescription, setNewModuleDescription] = useState('');

  const load = useCallback(async () => {
    if (!courseId) return;
    try {
      const [c, ds] = await Promise.all([adminApi.getCourse(courseId), adminApi.listDepartments()]);
      setCourse(c);
      setDepts(ds);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Lỗi tải khóa học');
    }
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSaveCourse(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!course) return;
    setSavingCourse(true);
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      await adminApi.updateCourse(course.id, {
        title: String(data.get('title') ?? '').trim(),
        description: String(data.get('description') ?? '').trim() || undefined,
        departmentId: String(data.get('departmentId') ?? course.departmentId),
        order: Number(data.get('order') ?? course.order),
        isPublished: data.get('isPublished') === 'on',
        unlockRule: parseJsonOrUndefined(String(data.get('unlockRule') ?? '')),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Lưu thất bại');
    } finally {
      setSavingCourse(false);
    }
  }

  async function handleAddModule(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!course || !newModuleTitle.trim()) return;
    try {
      await adminApi.createModule({
        courseId: course.id,
        title: newModuleTitle.trim(),
        description: newModuleDescription.trim() || undefined,
        order: (course.modules?.length ?? 0) + 1,
      });
      setNewModuleTitle('');
      setNewModuleDescription('');
      setModuleFormOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Tạo mô-đun thất bại');
    }
  }

  async function handleDeleteModule(m: AdminModule): Promise<void> {
    if (!confirm(`Xóa mô-đun "${m.title}" và mọi bài học bên trong?`)) return;
    try {
      await adminApi.deleteModule(m.id);
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Xóa thất bại');
    }
  }

  if (error && !course) {
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
  if (!course) return <LoadingScreen label="Đang tải" />;

  return (
    <div className="space-y-6">
      <div className="text-xs text-sky">
        <Link href="/dashboard/admin/courses" className="hover:text-orange">
          Quản lý khóa học
        </Link>
        <span className="mx-2">/</span>
        <span className="text-white">{course.title}</span>
      </div>

      {error && (
        <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
          ⚠ {error}
        </div>
      )}

      {/* Form sửa course */}
      <form onSubmit={handleSaveCourse} className="mkt-card space-y-4 p-6">
        <h2 className="text-h2-mkt-sm">
          <span className="mkt-pill-orange !text-sm">THÔNG TIN KHÓA HỌC</span>
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Tên khóa học">
            <input name="title" defaultValue={course.title} required minLength={2} className="mkt-input" />
          </Field>
          <Field label="Phòng ban">
            <select name="departmentId" defaultValue={course.departmentId} className="mkt-input">
              {depts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Thứ tự (order)">
            <input name="order" type="number" defaultValue={course.order} className="mkt-input" />
          </Field>
          <Field label="Publish">
            <label className="flex items-center gap-2 pt-1.5">
              <input
                name="isPublished"
                type="checkbox"
                defaultChecked={course.isPublished}
                className="h-5 w-5 rounded accent-orange"
              />
              <span className="text-sm text-ice">
                Cho phép user thấy khóa học này
              </span>
            </label>
          </Field>
        </div>
        <Field label="Mô tả">
          <textarea
            name="description"
            defaultValue={course.description ?? ''}
            rows={2}
            className="mkt-input"
          />
        </Field>
        <Field label="Quy tắc mở khóa (unlock_rule JSON — để trống nếu mặc định theo order)">
          <textarea
            name="unlockRule"
            defaultValue={course.unlockRule ? JSON.stringify(course.unlockRule, null, 2) : ''}
            rows={4}
            placeholder='{ "requireLevel": 2, "requireMinExp": 300 }'
            className="mkt-input font-mono text-xs"
          />
        </Field>
        <div className="flex justify-end">
          <button type="submit" disabled={savingCourse} className="mkt-btn-primary !text-sm disabled:opacity-60">
            {savingCourse ? 'Đang lưu...' : '💾 Lưu thay đổi'}
          </button>
        </div>
      </form>

      {/* Modules list */}
      <section className="mkt-card p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-h2-mkt-sm">
            <span className="mkt-pill-orange !text-sm">MÔ-ĐUN ({course.modules?.length ?? 0})</span>
          </h2>
          <button
            type="button"
            onClick={() => setModuleFormOpen((v) => !v)}
            className="mkt-btn-secondary !text-sm"
          >
            {moduleFormOpen ? 'Đóng' : '+ Thêm mô-đun'}
          </button>
        </div>

        {moduleFormOpen && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            onSubmit={handleAddModule}
            className="mb-4 space-y-3 rounded-xl border border-sky/30 bg-navy-deep/30 p-4"
          >
            <Field label="Tên mô-đun">
              <input
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                required
                minLength={2}
                className="mkt-input"
              />
            </Field>
            <Field label="Mô tả">
              <textarea
                value={newModuleDescription}
                onChange={(e) => setNewModuleDescription(e.target.value)}
                rows={2}
                className="mkt-input"
              />
            </Field>
            <div className="flex justify-end">
              <button type="submit" className="mkt-btn-primary !text-sm">
                Lưu mô-đun
              </button>
            </div>
          </motion.form>
        )}

        <ul className="space-y-3">
          {course.modules?.map((m) => (
            <ModuleItem key={m.id} module={m} onDelete={() => handleDeleteModule(m)} onChange={load} />
          ))}
          {(!course.modules || course.modules.length === 0) && (
            <motion.li
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border-2 border-dashed border-orange/50 bg-orange/5 p-8 text-center"
            >
              <div className="text-5xl">📚</div>
              <h3 className="mt-3 text-lg font-black uppercase text-white">
                Khóa học chưa có nội dung
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-ice">
                Bước tiếp theo: <strong className="text-orange">tạo mô-đun đầu tiên</strong>{' '}
                (VD: "M1 — Quy trình Sales"). Mỗi mô-đun chứa nhiều bài học. Sau khi tạo
                mô-đun, bạn có thể thêm bài học inline rất nhanh.
              </p>
              <button
                type="button"
                onClick={() => setModuleFormOpen(true)}
                className="mkt-btn-primary mt-5 !text-sm"
              >
                + Tạo mô-đun đầu tiên
              </button>
            </motion.li>
          )}
        </ul>
      </section>
    </div>
  );
}

function ModuleItem({
  module,
  onDelete,
  onChange,
}: {
  module: AdminModule;
  onDelete: () => void;
  onChange: () => void;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(module.title);
  const [savingModule, setSavingModule] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');

  async function saveModuleEdit(): Promise<void> {
    setSavingModule(true);
    try {
      await adminApi.updateModule(module.id, { title: editingTitle.trim() });
      await onChange();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Lỗi');
    } finally {
      setSavingModule(false);
    }
  }

  async function addLesson(): Promise<void> {
    if (!newLessonTitle.trim()) return;
    try {
      await adminApi.createLesson({
        moduleId: module.id,
        title: newLessonTitle.trim(),
        content: 'Nội dung bài học...',
        order: (module.lessons?.length ?? 0) + 1,
      });
      setNewLessonTitle('');
      await onChange();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Lỗi tạo bài');
    }
  }

  return (
    <li className="rounded-xl border-2 border-sky/30 bg-navy-deep/30">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mkt-pill-orange text-sm font-black text-white">
          M{module.order}
        </span>
        <input
          value={editingTitle}
          onChange={(e) => setEditingTitle(e.target.value)}
          onBlur={() => {
            if (editingTitle.trim() && editingTitle !== module.title) saveModuleEdit();
          }}
          className="mkt-input flex-1 min-w-0"
        />
        <span className="rounded-pill bg-sky/20 px-2 py-0.5 text-[10px] font-bold text-sky">
          {module.lessons?.length ?? 0} bài
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-pill bg-sky/20 px-3 py-1 text-xs font-bold text-sky hover:bg-sky/30"
        >
          {open ? 'Thu gọn' : 'Xem bài'}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-pill bg-pink/20 px-3 py-1 text-xs font-bold text-pink hover:bg-pink/30"
        >
          Xóa
        </button>
      </div>
      {savingModule && <div className="px-4 pb-2 text-xs text-sky">Đang lưu tên mô-đun...</div>}

      {open && (
        <div className="space-y-2 border-t border-sky/20 p-4">
          {module.lessons?.map((l) => (
            <div
              key={l.id}
              className="flex items-center gap-3 rounded-lg border border-sky/20 bg-navy-deep/40 px-3 py-2"
            >
              <span className="text-xs font-bold text-orange">B{l.order}</span>
              <Link
                href={`/dashboard/admin/lessons/${l.id}`}
                className="flex-1 truncate text-sm text-white hover:text-orange"
              >
                {l.title}
              </Link>
              {l.videoUrl && <span className="text-xs text-gold">🎬</span>}
              <button
                type="button"
                onClick={async () => {
                  if (!confirm(`Xóa bài "${l.title}"?`)) return;
                  await adminApi.deleteLesson(l.id);
                  await onChange();
                }}
                className="rounded bg-pink/20 px-2 py-0.5 text-xs text-pink hover:bg-pink/30"
              >
                Xóa
              </button>
            </div>
          ))}
          {(!module.lessons || module.lessons.length === 0) && (
            <div className="text-xs italic text-sky">Chưa có bài học</div>
          )}
          {/* Thêm bài học nhanh */}
          <div className="flex gap-2 pt-2">
            <input
              value={newLessonTitle}
              onChange={(e) => setNewLessonTitle(e.target.value)}
              placeholder="Tên bài học mới..."
              className="mkt-input flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addLesson();
                }
              }}
            />
            <button type="button" onClick={addLesson} className="mkt-btn-primary !text-xs !px-3 !py-1.5">
              + Thêm bài
            </button>
          </div>
        </div>
      )}
    </li>
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

function parseJsonOrUndefined(s: string): Record<string, unknown> | undefined {
  const t = s.trim();
  if (!t) return undefined;
  try {
    return JSON.parse(t) as Record<string, unknown>;
  } catch {
    throw new Error('unlock_rule không phải JSON hợp lệ');
  }
}
