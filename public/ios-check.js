/* 구형 iOS(Safari < 16.4)는 Next.js 16 + React 19 번들 실행에 실패해
   무한루프/깨짐이 발생한다. 번들과 별개로 도는 ES5 스크립트로 미리 감지해
   업데이트 안내를 띄운다. 데스크탑 UA로 위장한 최신 iPad 오탐 방지를 위해
   실제 iOS UA(iPhone/iPad/iPod)만 검사한다. (BUG-003) */
(function () {
  var ua = navigator.userAgent;
  if (!/iPhone|iPad|iPod/.test(ua)) return;
  var m = ua.match(/OS (\d+)_(\d+)/);
  if (!m) return;
  var v = parseFloat(m[1] + "." + m[2]);
  if (v >= 16.4) return;

  function show() {
    if (document.getElementById("__upg")) return;
    var el = document.createElement("div");
    el.id = "__upg";
    el.style.cssText =
      "position:fixed;top:0;left:0;right:0;bottom:0;z-index:2147483647;" +
      "background:#0f172a;color:#fff;display:flex;flex-direction:column;" +
      "align-items:center;justify-content:center;padding:24px;text-align:center;" +
      "font-family:-apple-system,BlinkMacSystemFont,sans-serif";
    el.innerHTML =
      '<div style="font-size:44px;margin-bottom:16px">⚠️</div>' +
      '<div style="font-size:18px;font-weight:700;line-height:1.5;margin-bottom:14px">' +
      "iOS 버전이 낮아<br>앱을 실행할 수 없습니다</div>" +
      '<div style="font-size:14px;line-height:1.7;opacity:.85">' +
      "<b>설정 → 일반 → 소프트웨어 업데이트</b>에서<br>" +
      "<b>iOS 16.4 이상</b>으로 업데이트한 뒤<br>" +
      "다시 접속·설치해 주세요.</div>";
    (document.body || document.documentElement).appendChild(el);
  }

  if (document.body) show();
  else document.addEventListener("DOMContentLoaded", show);
})();
