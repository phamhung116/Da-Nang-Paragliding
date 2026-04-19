import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Button, Field, Input } from "@paragliding/ui";
import { imageUploadAccept, optimizeImageFile } from "@/shared/lib/image-upload";

type ImageSourceFieldProps = {
  label: string;
  value: string;
  previewAlt: string;
  onChange: (nextValue: string) => void;
  placeholder?: string;
};

export const ImageSourceField = ({
  label,
  value,
  previewAlt,
  onChange,
  placeholder
}: ImageSourceFieldProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const isUploadedImage = value.startsWith("data:image/");
  const displayValue = isUploadedImage ? uploadedFileName || "Anh da tai len tu may cuc bo" : value;

  useEffect(() => {
    if (!isUploadedImage) {
      setUploadedFileName("");
    }
  }, [isUploadedImage]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const nextValue = await optimizeImageFile(file);
      setUploadedFileName(file.name);
      onChange(nextValue);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Khong the tai anh len.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="image-source-field">
      <Field label={label}>
        <Input
          value={displayValue}
          placeholder={placeholder}
          onChange={(event) => {
            setUploadedFileName("");
            onChange(event.target.value);
          }}
        />
      </Field>
      <div className="image-source-field__actions">
        <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
          {isProcessing ? "Dang xu ly anh..." : "Tai anh len"}
        </Button>
        {value ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setUploadedFileName("");
              onChange("");
            }}
          >
            Xoa anh
          </Button>
        ) : null}
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {value ? <img className="post-editor-sidebar__thumb" src={value} alt={previewAlt} /> : null}
      <input
        ref={fileInputRef}
        hidden
        type="file"
        accept={imageUploadAccept}
        onChange={handleFileChange}
      />
    </div>
  );
};
