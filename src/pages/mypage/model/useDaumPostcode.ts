const DAUM_POSTCODE_SCRIPT_URL = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
const DAUM_POSTCODE_SCRIPT_ID = 'daum-postcode-script';

export function openDaumPostcode(onComplete: (zipCode: string, address: string) => void) {
   const open = () => {
      const popupWidth = 500;
      const popupHeight = 600;
      const left = window.screenX + Math.round((window.outerWidth - popupWidth) / 2);
      const top = window.screenY + Math.round((window.outerHeight - popupHeight) / 2);

      new window.daum!.Postcode({
         oncomplete: (data) => {
            const selectedAddress = data.roadAddress || data.jibunAddress;
            onComplete(data.zonecode, selectedAddress);
         },
         width: popupWidth,
         height: popupHeight,
      }).open({ left, top });
   };

   if (window.daum?.Postcode) {
      open();
      return;
   }

   const existingScript = document.getElementById(DAUM_POSTCODE_SCRIPT_ID);
   if (existingScript) {
      existingScript.addEventListener('load', open, { once: true });
      return;
   }

   const script = document.createElement('script');
   script.id = DAUM_POSTCODE_SCRIPT_ID;
   script.src = DAUM_POSTCODE_SCRIPT_URL;
   script.onload = open;
   script.onerror = () => console.error('다음 우편번호 스크립트 로드에 실패했습니다.');
   document.head.appendChild(script);
}
