import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Badge, Button, Card, Field, Input, Panel, Textarea } from "@paragliding/ui";
import type { Post, PostWritePayload } from "@paragliding/api-client";
import { adminApi } from "@/shared/config/api";
import { AdminLayout } from "@/widgets/layout/admin-layout";
import { DataTable } from "@/widgets/data-table/data-table";

type PostFormValues = PostWritePayload;

const blankValues: PostFormValues = {
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  cover_image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
  published: true
};

export const PostsPage = () => {
  const queryClient = useQueryClient();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const { data = [] } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: () => adminApi.listPosts()
  });

  const { register, handleSubmit, reset, watch } = useForm<PostFormValues>({
    defaultValues: blankValues
  });

  useEffect(() => {
    if (!selectedPost) {
      reset(blankValues);
      return;
    }

    reset({
      slug: selectedPost.slug,
      title: selectedPost.title,
      excerpt: selectedPost.excerpt,
      content: selectedPost.content,
      cover_image: selectedPost.cover_image,
      published: selectedPost.published
    });
  }, [reset, selectedPost]);

  const saveMutation = useMutation({
    mutationFn: (payload: PostWritePayload) =>
      selectedPost ? adminApi.updatePost(selectedPost.slug, payload) : adminApi.createPost(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setSelectedPost(null);
      reset(blankValues);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => adminApi.deletePost(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setSelectedPost(null);
      reset(blankValues);
    }
  });

  const published = watch("published");

  return (
    <AdminLayout>
      <div className="portal-stack">
        <div className="portal-heading">
          <div className="portal-heading__text">
            <Badge>Content management</Badge>
            <h1>Posts</h1>
            <p>Publish operational stories and booking guidance from a single editorial desk.</p>
          </div>
          <div className="portal-heading__note">
            Admin owns create, edit and delete actions. Customer and pilot apps stay read only.
          </div>
        </div>

        <div className="admin-grid">
          <Card>
            <Panel className="admin-stack">
              <div className="admin-card__header">
                <div>
                  <h3>{selectedPost ? "Edit post" : "Create post"}</h3>
                  <p>Keep titles, excerpt, cover image and publish state in one compact editor.</p>
                </div>
                <Badge tone={published ? "success" : "danger"}>{published ? "PUBLISHED" : "DRAFT"}</Badge>
              </div>

              <form className="admin-form" onSubmit={handleSubmit((values) => saveMutation.mutate(values))}>
                <Field label="Slug">
                  <Input {...register("slug")} />
                </Field>
                <Field label="Title">
                  <Input {...register("title")} />
                </Field>
                <Field label="Excerpt">
                  <Textarea {...register("excerpt")} />
                </Field>
                <Field label="Content">
                  <Textarea {...register("content")} />
                </Field>
                <Field label="Cover image URL">
                  <Input {...register("cover_image")} />
                </Field>
                <label className="admin-checkbox">
                  <input type="checkbox" {...register("published")} />
                  <span>{published ? "Publish immediately" : "Save as draft"}</span>
                </label>
                {saveMutation.error instanceof Error ? <p className="form-error">{saveMutation.error.message}</p> : null}
                <div className="table-actions--inline">
                  <Button>{selectedPost ? "Save post" : "Publish post"}</Button>
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => {
                      setSelectedPost(null);
                      reset(blankValues);
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </form>
            </Panel>
          </Card>

          <Card>
            <Panel className="admin-stack">
              <div className="admin-card__header">
                <div>
                  <h3>Editorial queue</h3>
                  <p>Review publish state and open actions from a cleaner table layout.</p>
                </div>
              </div>

              <DataTable<Post>
                data={data}
                columns={[
                  {
                    key: "title",
                    title: "Post",
                    render: (row) => (
                      <div className="row-meta">
                        <strong>{row.title}</strong>
                        <span>{row.slug}</span>
                      </div>
                    )
                  },
                  {
                    key: "status",
                    title: "Status",
                    render: (row) => (
                      <Badge tone={row.published ? "success" : "danger"}>{row.published ? "PUBLISHED" : "DRAFT"}</Badge>
                    )
                  },
                  {
                    key: "date",
                    title: "Date",
                    render: (row) => new Date(row.published_at ?? row.created_at ?? "").toLocaleDateString("vi-VN")
                  },
                  {
                    key: "actions",
                    title: "Actions",
                    render: (row) => (
                      <details className="action-menu">
                        <summary className="action-menu__trigger">Manage</summary>
                        <div className="action-menu__content">
                          <button className="action-menu__item" type="button" onClick={() => setSelectedPost(row)}>
                            Edit post
                          </button>
                          <button
                            className="action-menu__item action-menu__item--danger"
                            type="button"
                            onClick={() => deleteMutation.mutate(row.slug)}
                          >
                            Delete post
                          </button>
                        </div>
                      </details>
                    )
                  }
                ]}
              />
            </Panel>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};
