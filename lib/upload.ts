/**
 * Utility to upload a file through our server-side API proxy to bypass Supabase RLS restrictions.
 */
export function uploadFile(
  file: File,
  bucket: string,
  onProgress: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucket);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload", true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve(res.url);
        } catch {
          reject(new Error("Gagal membaca respon server."));
        }
      } else {
        try {
          const errResponse = JSON.parse(xhr.responseText);
          reject(
            new Error(
              errResponse.error ||
                errResponse.message ||
                `Gagal mengunggah gambar (Status ${xhr.status})`
            )
          );
        } catch {
          reject(new Error(`Gagal mengunggah gambar (Status ${xhr.status})`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error("Terjadi kesalahan jaringan saat mengunggah gambar."));
    };

    xhr.send(formData);
  });
}
