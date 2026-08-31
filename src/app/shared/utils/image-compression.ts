// -------------------------------------------------------------------
// Redimensiona e recomprime uma imagem no navegador antes do upload —
// fotos de celular costumam vir com varios MB, o que deixa o upload
// lento e infla o Postgres (bytea, sem storage externo). Reduzir aqui
// pro maior lado ficar em no maximo maxDimension e recomprimir como
// JPEG mantem qualidade suficiente pra visualizacao clinica.
// -------------------------------------------------------------------
export async function compressImage(file: File, maxDimension = 1600, quality = 0.8): Promise<File> {
  const bitmap = await createImageBitmap(file);

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return file;

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (!blob) return file;

  const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
  return new File([blob], newName, { type: 'image/jpeg' });
}
