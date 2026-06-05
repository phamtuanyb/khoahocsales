'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LoadingScreen } from '@/components/loading-screen';
import { ApiError } from '@/lib/api-client';
import { adminApi, type AdminCourse, type AdminDepartment } from '@/lib/admin-api';

export default function AdminCoursesPage(): JSX.Element {
  const router = useRouter();
  const [courses, setCourses] = useState<AdminCourse[] | null>(null);
  const [depts, setDepts] = useState<AdminDepartment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [order, setOrder] = useState(1);

  const load = async (): Promise<void> => {
    try {
      const [cs, ds] = await Promise.all([adminApi.listCourses(), adminApi.listDepartments()]);
      setCourses(cs);
      setDepts(ds);
      if (!departmentId && ds[0]) setDepartmentId(ds[0].id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được dữ liệu');
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!title.trim() || !departmentId) return;
    setCreating(true);
    setError(null);
    try {
      // Sau khi tạo course → dẫn admin vào trang chi tiết để thêm mô-đun + bài học.
      const created = await adminApi.createCourse({
        title: title.trim(),
        description: description.trim() || undefined,
        departmentId,
        order,
        isPublished: true,
      });
      router.push(`/dashboard/admin/courses/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Tạo khóa học thất bại');
      setCreating(false);
    }
  }

  async function handleTogglePublish(course: AdminCourse): Promise<void> {
    try {
      await adminApi.updateCourse(course.id, { isPublished: !course.isPublished });
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Cập nhật thất bại');
    }
  }

  async function handleDelete(course: AdminCourse): Promise<void> {
    if (!confirm(`Xóa khóa "${course.title}"? Mọi mô-đun/bài học bên trong sẽ bị xóa.`)) return;
    try {
      await adminApi.deleteCourse(course.id);
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Xóa thất bại');
    }
  }

  if (!courses) return <LoadingScreen label="Đang tải khóa học" />;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="mkt-pill-orange !text-xs">SOẠN NỘI DUNG</span>
          <h1 className="mt-3 text-h2-mkt-sm text-shadow-mkt">QUẢN LÝ KHÓA HỌC</h1>
          <p className="mt-1 text-sm text-ice">
            Tạo, sửa, xóa, ẩn/hiện khóa học. Bấm vào tên khóa để quản lý mô-đun + bài học.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className="mkt-btn-primary !text-sm"
        >
          {formOpen ? 'Đóng form' : '+ Tạo khóa học'}
        </button>
      </header>

      {error && (
        <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
          ⚠ {error}
        </div>
      )}

      {formOpen && (
        <motion.form
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreate}
          className="mkt-card space-y-4 p-6"
        >
          <h2 className="text-h2-mkt-sm">
            <span className="mkt-pill-orange !text-sm">TẠO KHÓA HỌC MỚI</span>
          </h2>
          <div className="rounded-xl border border-sky/30 bg-sky/5 p-3 text-xs text-ice">
            💡 Bước này chỉ tạo khung khóa học (tên, phòng ban). Sau khi lưu, bạn sẽ được
            <strong className="text-orange"> đưa thẳng vào trang chi tiết</strong> để thêm mô-đun + bài học + video + bài thi.
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Tên khóa học">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                minLength={2}
                className="mkt-input"
              />
            </Field>
            <Field label="Phòng ban">
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                required
                className="mkt-input"
              >
                {depts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Thứ tự hiển thị (order)">
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                min={0}
                className="mkt-input"
              />
            </Field>
          </div>
          <Field label="Mô tả">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mkt-input"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="mkt-btn-secondary !text-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={creating}
              className="mkt-btn-primary !text-sm disabled:opacity-60"
            >
              {creating ? 'Đang tạo...' : 'Lưu & vào thêm nội dung →'}
            </button>
          </div>
        </motion.form>
      )}

      <section className="mkt-card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-navy-deep/60 text-left text-[10px] font-bold uppercase tracking-widest text-sky">
            <tr>
              <th className="px-4 py-3">Khóa học</th>
              <th className="px-4 py-3">Phòng ban</th>
              <th className="px-4 py-3 text-center">Mô-đun</th>
              <th className="px-4 py-3 text-center">Order</th>
              <th className="px-4 py-3 text-center">Trạng thái</th>
              <th className="px-4 py-3 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-sm text-sky">
                  Chưa có khóa học. Bấm "+ Tạo khóa học" để bắt đầu.
                </td>
              </tr>
            )}
            {courses.map((c) => (
              <tr key={c.id} className="border-t border-sky/10">
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/admin/courses/${c.id}`}
                    className="font-bold text-white hover:text-orange"
                  >
                    {c.title}
                  </Link>
                  {c.description && (
                    <div className="line-clamp-1 text-xs text-ice">{c.description}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-ice">{c.department.name}</td>
                <td className="px-4 py-3 text-center text-gold">{c._count?.modules ?? 0}</td>
                <td className="px-4 py-3 text-center text-ice">{c.order}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(c)}
                    className={`rounded-pill px-3 py-0.5 text-[10px] font-bold uppercase transition ${
                      c.isPublished
                        ? 'bg-gold/20 text-gold hover:bg-gold/30'
                        : 'bg-navy-deep/60 text-sky/60 hover:bg-navy-deep/80'
                    }`}
                  >
                    {c.isPublished ? 'Đã publish' : 'Nháp'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/dashboard/admin/courses/${c.id}`}
                      className="rounded-pill bg-sky/20 px-3 py-1 text-xs font-bold text-sky hover:bg-sky/30"
                    >
                      Sửa
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(c)}
                      className="rounded-pill bg-pink/20 px-3 py-1 text-xs font-bold text-pink hover:bg-pink/30"
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
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
