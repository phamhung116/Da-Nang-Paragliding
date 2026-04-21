import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Editor as TinyMceReactEditor } from "@tinymce/tinymce-react";
import type { Editor as TinyMceCoreEditor } from "tinymce";
import "tinymce/tinymce";
import "tinymce/models/dom/model";
import "tinymce/themes/silver";
import "tinymce/icons/default";
import "tinymce/skins/ui/oxide/skin";
import "tinymce/skins/content/default/content";
import "tinymce/skins/ui/oxide/content";
import "tinymce/plugins/advlist";
import "tinymce/plugins/autolink";
import "tinymce/plugins/charmap";
import "tinymce/plugins/code";
import "tinymce/plugins/fullscreen";
import "tinymce/plugins/help";
import "tinymce/plugins/help/js/i18n/keynav/en";
import "tinymce/plugins/image";
import "tinymce/plugins/link";
import "tinymce/plugins/lists";
import "tinymce/plugins/media";
import "tinymce/plugins/preview";
import "tinymce/plugins/quickbars";
import "tinymce/plugins/searchreplace";
import "tinymce/plugins/table";
import "tinymce/plugins/visualblocks";
import "tinymce/plugins/wordcount";
import { Badge, Button, Card, Dialog, Field, Input, Panel, Textarea } from "@paragliding/ui";
import type { PostWritePayload } from "@paragliding/api-client";
import { adminApi } from "@/shared/config/api";
import { routes } from "@/shared/config/routes";
import { ImageSourceField } from "@/widgets/forms/image-source-field";
import { AdminLayout } from "@/widgets/layout/admin-layout";

const blankValues: PostWritePayload = {
  slug: "",
  title: "",
  title_en: "",
  excerpt: "",
  excerpt_en: "",
  content: "",
  content_en: "",
  cover_image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
  published: true
};

const maxInlineImageBytes = 2 * 1024 * 1024;

const tinyMcePlugins = [
  "advlist",
  "autolink",
  "lists",
  "link",
  "image",
  "charmap",
  "searchreplace",
  "visualblocks",
  "code",
  "fullscreen",
  "media",
  "table",
  "preview",
  "quickbars",
  "help",
  "wordcount"
];

const tinyMceToolbar = [
  "undo redo",
  "blocks fontfamily fontsizeinput",
  "bold italic underline strikethrough superscript subscript forecolor backcolor",
  "alignleft aligncenter alignright alignjustify",
  "bullist numlist outdent indent",
  "selectedlink unlink image media table",
  "removeformat visualblocks code preview fullscreen help"
].join(" | ");

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/\u0110/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^(https?:|mailto:|tel:|#|\/)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const applyAnchorOptions = (anchor: HTMLAnchorElement, href: string, newTab: boolean) => {
  anchor.setAttribute("href", href);
  if (newTab) {
    anchor.setAttribute("target", "_blank");
    anchor.setAttribute("rel", "noopener noreferrer");
  } else {
    anchor.removeAttribute("target");
    anchor.removeAttribute("rel");
  }
};

const readBlobAsDataUrl = (blob: Blob) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Không thể đọc file ảnh này."));
    reader.readAsDataURL(blob);
  });
};

const notifyEditor = (editor: TinyMceCoreEditor, text: string, type: "error" | "warning" | "success" | "info" = "warning") => {
  editor.notificationManager.open({
    text,
    type,
    timeout: 3500
  });
};

const selectedContentContainsImage = (editor: TinyMceCoreEditor) => {
  const selectedNode = editor.selection.getNode();
  const selectedHtml = editor.selection.getContent({ format: "html" });
  return selectedNode.nodeName === "IMG" || /<img[\s>]/i.test(selectedHtml);
};

const findSelectedAnchor = (editor: TinyMceCoreEditor) => {
  return editor.dom.getParent(editor.selection.getNode(), "a[href]") as HTMLAnchorElement | null;
};

const openSelectedTextLinkDialog = (editor: TinyMceCoreEditor) => {
  const anchor = findSelectedAnchor(editor);
  const selectedText = editor.selection.getContent({ format: "text" }).trim();

  if (!anchor && !selectedText) {
    notifyEditor(editor, "Hãy bôi đen đoạn text cần gắn link.");
    return;
  }

  if (!anchor && selectedContentContainsImage(editor)) {
    notifyEditor(editor, "Link chỉ áp dụng cho text đang được bôi đen, không gắn link trực tiếp vào ảnh.");
    return;
  }

  editor.windowManager.open({
    title: anchor ? "Sửa liên kết" : "Chèn liên kết",
    body: {
      type: "panel",
      items: [
        {
          type: "input",
          name: "url",
          label: "URL liên kết"
        },
        {
          type: "checkbox",
          name: "newTab",
          label: "Mở link trong tab mới"
        }
      ]
    },
    buttons: [
      {
        type: "cancel",
        text: "Hủy"
      },
      {
        type: "submit",
        text: "Áp dụng",
        primary: true
      }
    ],
    initialData: {
      url: anchor?.getAttribute("href") ?? "",
      newTab: anchor ? anchor.target === "_blank" : true
    },
    onSubmit: (api) => {
      const data = api.getData() as { url: string; newTab: boolean };
      const href = normalizeUrl(data.url);

      if (!href) {
        notifyEditor(editor, "Nhập URL liên kết trước khi áp dụng.", "error");
        return;
      }

      editor.undoManager.transact(() => {
        if (anchor && editor.getBody().contains(anchor)) {
          applyAnchorOptions(anchor, href, data.newTab);
          editor.selection.select(anchor);
        } else {
          editor.execCommand("mceInsertLink", false, {
            href,
            target: data.newTab ? "_blank" : undefined,
            rel: data.newTab ? "noopener noreferrer" : undefined
          });
        }
      });
      editor.nodeChanged();
      api.close();
    }
  });
};

const makeImageUploadHandler = (editor: TinyMceCoreEditor) => {
  return async (blobInfo: { blob: () => Blob; filename: () => string }) => {
      const blob = blobInfo.blob();
    if (blob.size > maxInlineImageBytes) {
      const message = `Ảnh chèn trực tiếp tối đa ${Math.round(maxInlineImageBytes / 1024 / 1024)}MB.`;
      notifyEditor(editor, message, "error");
      throw new Error(message);
    }
    return readBlobAsDataUrl(blob);
  };
};

const createTinyMceInit = (editorRef: { current: TinyMceCoreEditor | null }) => ({
  height: 540,
  min_height: 420,
  menubar: "edit view format table tools",
  plugins: tinyMcePlugins,
  toolbar: tinyMceToolbar,
  toolbar_mode: "sliding" as const,
  contextmenu: "image table",
  quickbars_selection_toolbar: "bold italic underline | selectedlink unlink | blockquote",
  quickbars_insert_toolbar: "quickimage quicktable",
  quickbars_image_toolbar: "alignleft aligncenter alignright | image",
  block_formats: "Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Quote=blockquote; Code=pre",
  font_family_formats:
    "Be Vietnam Pro='Be Vietnam Pro', sans-serif;Arial=arial,helvetica,sans-serif;Verdana=verdana,geneva,sans-serif;Tahoma=tahoma,arial,helvetica,sans-serif;Georgia=georgia,palatino,serif;Times New Roman='Times New Roman',times,serif;Courier New='Courier New',courier,monospace",
  font_size_input_default_unit: "px",
  font_size_formats: "10px 12px 14px 16px 18px 20px 24px 28px 32px 36px 42px 48px",
  image_title: true,
  image_caption: true,
  image_advtab: true,
  image_dimensions: true,
  object_resizing: "img",
  resize_img_proportional: true,
  automatic_uploads: true,
  paste_data_images: true,
  images_file_types: "jpg,jpeg,png,gif,webp",
  images_upload_handler: (blobInfo: { blob: () => Blob; filename: () => string }) => {
    const editor = editorRef.current;
    if (!editor) {
      throw new Error("Editor chưa sẵn sàng.");
    }
    return makeImageUploadHandler(editor)(blobInfo);
  },
  file_picker_types: "image",
  file_picker_callback: (callback: (value: string, meta?: Record<string, string>) => void, _value: string, meta: { filetype?: string }) => {
    if (meta.filetype !== "image") {
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/gif,image/webp";
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      const editor = editorRef.current;
      if (!file || !editor) {
        return;
      }
      if (file.size > maxInlineImageBytes) {
        notifyEditor(editor, `Ảnh chèn trực tiếp tối đa ${Math.round(maxInlineImageBytes / 1024 / 1024)}MB.`, "error");
        return;
      }
      const dataUrl = await readBlobAsDataUrl(file);
      callback(dataUrl, {
        alt: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ")
      });
    });
    input.click();
  },
  convert_urls: false,
  branding: false,
  promotion: false,
  content_style: `
    @import url("https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap");
    body {
      margin: 0;
      padding: 24px;
      color: #2d1e27;
      font-family: "Be Vietnam Pro", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 16px;
      line-height: 1.75;
    }
    p { margin: 0 0 1rem; }
    h1, h2, h3 { margin: 1.2rem 0 0.65rem; line-height: 1.2; color: #2d1e27; }
    h1 { font-size: 2rem; }
    h2 { font-size: 1.55rem; }
    h3 { font-size: 1.25rem; }
    a { color: #8c1538; font-weight: 700; text-decoration: underline; text-underline-offset: 0.18em; }
    blockquote {
      margin: 1rem 0;
      padding: 0.9rem 1rem;
      border-left: 4px solid #c91842;
      border-radius: 8px;
      background: #fff7f9;
    }
    pre {
      overflow-x: auto;
      padding: 1rem;
      border-radius: 8px;
      background: #211f22;
      color: #fff7f9;
      white-space: pre-wrap;
    }
    img { max-width: 100%; height: auto; border-radius: 8px; }
    figure.image { display: table; margin: 1.25rem auto; }
    figure.image img { display: block; margin: 0 auto; }
    figure.image figcaption {
      padding-top: 0.45rem;
      color: #78646c;
      font-size: 0.86rem;
      line-height: 1.55;
      text-align: center;
    }
  `,
  setup: (editor: TinyMceCoreEditor) => {
    editor.ui.registry.addButton("selectedlink", {
      icon: "link",
      tooltip: "Chèn/sửa link cho text đang bôi đen",
      onAction: () => openSelectedTextLinkDialog(editor)
    });
    editor.addShortcut("Meta+K", "Chèn/sửa link", () => openSelectedTextLinkDialog(editor));
    editor.addShortcut("Ctrl+K", "Chèn/sửa link", () => openSelectedTextLinkDialog(editor));
  }
});

export const PostDetailPage = () => {
  const { slug = "" } = useParams();
  const isNew = slug === "new";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const editorViRef = useRef<TinyMceCoreEditor | null>(null);
  const editorEnRef = useRef<TinyMceCoreEditor | null>(null);
  const form = useForm<PostWritePayload>({ defaultValues: blankValues });
  const published = form.watch("published");
  const coverImage = form.watch("cover_image");
  const titleVi = form.watch("title");
  const [editorContentVi, setEditorContentVi] = useState("");
  const [editorContentEn, setEditorContentEn] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const titleViField = form.register("title");
  const titleEnField = form.register("title_en");
  const slugField = form.register("slug");

  const postQuery = useQuery({
    queryKey: ["admin-post", slug],
    queryFn: () => adminApi.getPost(slug),
    enabled: Boolean(slug) && !isNew
  });

  const saveMutation = useMutation({
    mutationFn: (payload: PostWritePayload) => (isNew ? adminApi.createPost(payload) : adminApi.updatePost(slug, payload)),
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      navigate(`/posts/${post.slug}`, { replace: true });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deletePost(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      navigate(routes.posts, { replace: true });
    }
  });

  const updateEditorContentVi = (content: string) => {
    setEditorContentVi(content);
    form.setValue("content", content, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
  };

  const updateEditorContentEn = (content: string) => {
    setEditorContentEn(content);
    form.setValue("content_en", content, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
  };

  const handlePostSubmit = (values: PostWritePayload) => {
    const nextContent = editorViRef.current?.getContent() ?? editorContentVi;
    const nextContentEn = editorEnRef.current?.getContent() ?? editorContentEn;
    saveMutation.mutate({
      ...values,
      slug: values.slug.trim() || slugify(values.title),
      content: nextContent,
      content_en: nextContentEn
    });
  };

  const setCoverImage = (nextValue: string) => {
    form.setValue("cover_image", nextValue, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
  };

  useEffect(() => {
    if (isNew) {
      form.reset(blankValues);
      setEditorContentVi("");
      setEditorContentEn("");
      setIsSlugCustomized(false);
      return;
    }

    if (postQuery.data) {
      const nextValues = {
        slug: postQuery.data.slug,
        title: postQuery.data.title,
        title_en: postQuery.data.title_en,
        excerpt: postQuery.data.excerpt,
        excerpt_en: postQuery.data.excerpt_en,
        content: postQuery.data.content,
        content_en: postQuery.data.content_en,
        cover_image: postQuery.data.cover_image,
        published: postQuery.data.published
      };
      form.reset(nextValues);
      setEditorContentVi(postQuery.data.content);
      setEditorContentEn(postQuery.data.content_en);
      setIsSlugCustomized(postQuery.data.slug !== slugify(postQuery.data.title));
    }
  }, [form, isNew, postQuery.data]);

  useEffect(() => {
    if (isSlugCustomized) {
      return;
    }

    form.setValue("slug", slugify(titleVi), {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: true
    });
  }, [form, isSlugCustomized, titleVi]);

  return (
    <AdminLayout>
      <div className="portal-stack">
        <div className="portal-heading">
          <div className="portal-heading__text">
            <Badge>{published ? "PUBLISHED" : "DRAFT"}</Badge>
            <h1>{isNew ? "Tạo bài viết" : postQuery.data?.title ?? "Post detail"}</h1>
            <p>Trang chi tiết bài viết tập trung vào nội dung song ngữ và metadata của bài viết này.</p>
          </div>
          <Link to={routes.posts}>
            <Button variant="secondary">Quay lại danh sách</Button>
          </Link>
        </div>

        <Card className="post-editor-card">
          <Panel className="admin-stack">
            <form className="post-editor-layout" onSubmit={form.handleSubmit(handlePostSubmit)}>
              <div className="admin-stack">
                <div className="rich-text-editor">
                  <div className="admin-card__header">
                    <div>
                      <h3>Nội dung bài viết (VI)</h3>
                      <p>Phiên bản hiển thị cho khách khi đang dùng tiếng Việt.</p>
                    </div>
                  </div>
                  <TinyMceReactEditor
                    licenseKey="gpl"
                    value={editorContentVi}
                    onInit={(_event, editor) => {
                      editorViRef.current = editor;
                    }}
                    onEditorChange={updateEditorContentVi}
                    init={createTinyMceInit(editorViRef)}
                  />
                </div>

                <div className="rich-text-editor">
                  <div className="admin-card__header">
                    <div>
                      <h3>Post Content (EN)</h3>
                      <p>Phiên bản hiển thị cho khách khi đang dùng tiếng Anh.</p>
                    </div>
                  </div>
                  <TinyMceReactEditor
                    licenseKey="gpl"
                    value={editorContentEn}
                    onInit={(_event, editor) => {
                      editorEnRef.current = editor;
                    }}
                    onEditorChange={updateEditorContentEn}
                    init={createTinyMceInit(editorEnRef)}
                  />
                </div>
              </div>

              <aside className="post-editor-sidebar">
                <div className="post-publish-card">
                  <Badge>{published ? "Đã sẵn sàng" : "Bản nháp"}</Badge>
                  <strong>{isNew ? "Bài viết mới" : "Xuất bản"}</strong>
                  <p>Kiểm tra nội dung lần cuối trước khi lưu thay đổi.</p>
                </div>
                <Field label="Tiêu đề (VI)">
                  <Input {...titleViField} />
                </Field>
                <Field label="Tiêu đề (EN)">
                  <Input {...titleEnField} />
                </Field>
                <Field label="Slug">
                  <Input
                    {...slugField}
                    placeholder="Tự tạo nếu để trống"
                    onChange={(event) => {
                      setIsSlugCustomized(true);
                      slugField.onChange(event);
                    }}
                  />
                </Field>
                <Field label="Tóm tắt ngắn (VI)">
                  <Textarea {...form.register("excerpt")} />
                </Field>
                <Field label="Tóm tắt ngắn (EN)">
                  <Textarea {...form.register("excerpt_en")} />
                </Field>
                <ImageSourceField
                  label="Thumbnail"
                  value={coverImage}
                  previewAlt="Post thumbnail preview"
                  placeholder="https://..."
                  previewCaption={titleVi}
                  onChange={setCoverImage}
                />
                <input type="hidden" {...form.register("cover_image", { required: true })} />
                <label className="admin-checkbox">
                  <input type="checkbox" {...form.register("published")} />
                  <span>{published ? "Đang published" : "Lưu draft"}</span>
                </label>
                <input type="hidden" {...form.register("content")} />
                <input type="hidden" {...form.register("content_en")} />
                {saveMutation.error instanceof Error ? <p className="form-error">{saveMutation.error.message}</p> : null}
                {deleteMutation.error instanceof Error ? <p className="form-error">{deleteMutation.error.message}</p> : null}
                <div className="post-editor-sidebar__actions">
                  <Button disabled={saveMutation.isPending}>{saveMutation.isPending ? "Đang lưu..." : "Lưu bài viết"}</Button>
                  {!isNew ? (
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      Xóa bài viết
                    </Button>
                  ) : null}
                </div>
              </aside>
            </form>
          </Panel>
        </Card>

        <Dialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            if (!deleteMutation.isPending) {
              setDeleteDialogOpen(open);
            }
          }}
          title={`Xóa bài viết ${form.watch("title") || slug}`}
          description="Bài viết sau khi xóa sẽ biến mất khỏi danh sách hiển thị cho khách hàng."
          icon="!"
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setDeleteDialogOpen(false)}>
                Đóng
              </Button>
              <Button type="button" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
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
