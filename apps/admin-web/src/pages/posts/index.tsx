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
            <Badge>Content management</Badge>
            <h1>Posts</h1>
            <p>Click vao mot bai viet de mo trang chi tiet va sua noi dung.</p>
          </div>
          <Button onClick={() => navigate("/posts/new")}>Tao bai viet</Button>
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
                  title: "Bai viet",
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
                  title: "Trang thai",
                  render: (row) => <Badge tone={row.published ? "success" : "danger"}>{row.published ? "PUBLISHED" : "DRAFT"}</Badge>
                },
                {
                  key: "date",
                  title: "Ngay",
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
                        Xem chi tiet
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={(event) => {
                          event.stopPropagation();
                          setPostPendingDelete(row);
                        }}
                      >
                        Xoa
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
          title={`Xoa bai viet ${postPendingDelete?.title ?? ""}`}
          description="Bai viet sau khi xoa se bien mat khoi danh sach hien thi cho khach hang."
          icon="!"
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setPostPendingDelete(null)}>
                Dong
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
                {deleteMutation.isPending ? "Dang xoa..." : "Xoa bai viet"}
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
