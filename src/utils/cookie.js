/**
 * Cookieに値を設定する
 * @param {string} name - Cookieの名前
 * @param {string} value - 設定する値
 * @param {number} days - 有効期限 (日数)
 */
export const setCookie = (name, value, days) => {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "")  + expires + "; path=/";
};

/**
 * Cookieから値を取得する
 * @param {string} name - Cookieの名前
 * @returns {string|null} Cookieの値、またはnull
 */
export const getCookie = (name) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for(let i=0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0)===' ') c = c.substring(1,c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length,c.length);
  }
  return null;
};

/**
 * Cookieを削除する
 * @param {string} name - Cookieの名前
 */
export const eraseCookie = (name) => {
  document.cookie = name+'=; Max-Age=-99999999;';
};