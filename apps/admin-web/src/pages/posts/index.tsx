import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, Dialog, Panel } from "@paragliding/ui";
import type { Post } from "@paragliding/api-client";
import { adminApi } from "@/shared/config/api";
import { AdminLayout } from "@/widgets/layout/admin-layout";
import { DataTable } from "@/widgets/data-table/data-table";

export const PostsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [postPendingDelete, setPostPendingDelete] = useState<Post | null>(null);
  const { data = [] } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: () => adminApi.listPosts()
  });

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => adminApi.deletePost(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setPostPendingDelete(null);
    }
  });

  return (
    <AdminLayout>
      <div className="portal-stack">
        <div className="portal-heading">
          <div className="portal-heading__text">
            <Badge>Quản lý nội dung</Badge>
            <h1>Bài viết</h1>
            <p>Bấm vào một bài viết để mở trang chi tiết và sửa nội dung.</p>
          </div>
          <Button onClick={() => navigate("/posts/new")}>Tạo bài viết</Button>
        </div>

        <Card className="admin-list-card">
          <Panel className="admin-stack">
            <DataTable<Post>
              data={data}
              getRowKey={(row) => row.slug}
              onRowClick={(row) => navigate(`/posts/${row.slug}`)}
              columns={[
                {
                  key: "title",
                  title: "Bài viết",
                  render: (row) => (
                    <div className="row-meta">
                      <strong>{row.title}</strong>
                      <span>{row.slug}</span>
                      <small>{row.excerpt}</small>
                    </div>
                  )
                },
                {
                  key: "status",
                  title: "Trạng thái",
                  render: (row) => <Badge tone={row.published ? "success" : "danger"}>{row.published ? "Đã xuất bản" : "Bản nháp"}</Badge>
                },
                {
                  key: "date",
                  title: "Ngày",
                  render: (row) => new Date(row.published_at ?? row.created_at ?? "").toLocaleDateString("vi-VN")
                },
                {
                  key: "actions",
                  title: "",
                  render: (row) => (
                    <div className="table-actions--inline">
                      <Button
                        variant="secondary"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/posts/${row.slug}`);
                        }}
                      >
                        Xem chi tiết
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={(event) => {
                          event.stopPropagation();
                          setPostPendingDelete(row);
                        }}
                      >
                        Xóa
                      </Button>
                    </div>
                  )
                }
              ]}
            />
          </Panel>
        </Card>

        <Dialog
          open={Boolean(postPendingDelete)}
          onOpenChange={(open) => {
            if (!open && !deleteMutation.isPending) {
              setPostPendingDelete(null);
            }
          }}
          title={`Xóa bài viết ${postPendingDelete?.title ?? ""}`}
          description="Bài viết sau khi xóa sẽ biến mất khỏi danh sách hiển thị cho khách hàng."
          icon="!"
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setPostPendingDelete(null)}>
                Đóng
              </Button>
              <Button
                type="button"
                disabled={!postPendingDelete || deleteMutation.isPending}
                onClick={() => {
                  if (postPendingDelete) {
                    deleteMutation.mutate(postPendingDelete.slug);
                  }
                }}
              >
                {deleteMutation.isPending ? "Đang xóa..." : "Xóa bài viết"}
              </Button>
            </>
          }
        >
          {deleteMutation.error instanceof Error ? <p className="form-error">{deleteMutation.error.message}</p> : null}
        </Dialog>
      </div>
    </AdminLayout>
  );
};
