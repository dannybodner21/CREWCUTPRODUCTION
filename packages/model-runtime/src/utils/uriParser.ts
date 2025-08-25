interface UriParserResult {
  base64: string | null;
  mimeType: string | null;
  type: 'url' | 'base64' | null;
}

export const parseDataUri = (dataUri: string): UriParserResult => {
  // 正则表达式匹配整个 Data URI 结构
  const dataUriMatch = dataUri.match(/^data:([^;]+);base64,(.+)$/);

  if (dataUriMatch) {
    // 如果是合法的 Data URI
    let mimeType = dataUriMatch[1];

    // Extract only the base MIME type, removing any additional parameters
    if (mimeType && mimeType.includes(';')) {
      mimeType = mimeType.split(';')[0];
    }

    // Safety check: if MIME type is empty or invalid, provide fallback
    if (!mimeType || mimeType === '') {
      // Try to infer from the data URI context or default to PNG
      mimeType = 'image/png';
    }

    return { base64: dataUriMatch[2], mimeType, type: 'base64' };
  }

  try {
    new URL(dataUri);
    // 如果是合法的 URL
    return { base64: null, mimeType: null, type: 'url' };
  } catch {
    // 既不是 Data URI 也不是合法 URL
    return { base64: null, mimeType: null, type: null };
  }
};
