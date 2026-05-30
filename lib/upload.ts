/**
 * Utility to upload a file directly to Supabase Storage using XMLHttpRequest
 * to allow client-side upload progress tracking without external dependencies.
 */
export function uploadFile(
  file: File,
  bucket: string,
  onProgress: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nyuomnjaxklktiygbcrp.supabase.co";
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseKey) {
      reject(
        new Error(
          "Supabase Anon Key belum dikonfigurasi pada environment. Silakan hubungi Administrator."
        )
      );
      return;
    }

    // Generate a unique filename to avoid collision
    const ext = file.name.split(".").pop() || "";
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = `${Date.now()}_${randomStr}.${ext}`;
    const filePath = fileName; // Directly under bucket root

    const url = `${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`;
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Authorization", `Bearer ${supabaseKey}`);
    xhr.setRequestHeader("apikey", supabaseKey);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`;
        resolve(publicUrl);
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

    xhr.send(file);
  });
}
