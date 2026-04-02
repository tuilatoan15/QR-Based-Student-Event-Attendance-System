/// Utility methods for string manipulation

/// Removes Vietnamese diacritics (accents) from a string
/// e.g. "Hương" -> "Huong"
String removeDiacritics(String str) {
  const withDia =
      'áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ';
  const withoutDia =
      'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyydAAAAAAAAAAAAAAAAAEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYYD';

  for (int i = 0; i < withDia.length; i++) {
    str = str.replaceAll(withDia[i], withoutDia[i]);
  }
  return str;
}

/// Removes HTML tags from a string
String stripHtml(String htmlString) {
  if (htmlString.isEmpty) return "";
  
  String result = htmlString;
  
  // Handle escaped tags that might slip through
  result = result.replaceAll("&lt;", "<")
                .replaceAll("&gt;", ">")
                .replaceAll("&amp;", "&")
                .replaceAll("&quot;", "\"")
                .replaceAll("&apos;", "'")
                .replaceAll("&nbsp;", " ");
  
  // Remove all HTML tags
  result = result.replaceAll(RegExp(r'<[^>]*>', multiLine: true, dotAll: true), ' ');
  
  // Remove multiple spaces/newlines
  result = result.replaceAll(RegExp(r'\s+'), ' ');
  
  return result.trim();
}
