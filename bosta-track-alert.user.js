// ==UserScript==
// @name         Bosta Track Alerts (multi-track, robust SPA)
// @namespace    http://tampermonkey.net/
// @version      1.3
// @updateURL    https://raw.githubusercontent.com/siefaldeenalsatar-sudo/bosta-track-alert/main/bosta-track-alert.user.js
// @downloadURL  https://raw.githubusercontent.com/siefaldeenalsatar-sudo/bosta-track-alert/main/bosta-track-alert.user.js
// @description  Shows alert banners for specified track IDs (works across SPA, subdomains, history changes). Add track->message in TRACKS map.
// @match        https://*.bosta.co/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function(){
  'use strict';
  console.log('[BostaTrackAlerts] started');

  // --- CONFIG: أضف التراكات والرسائل اللي تريدها هنا ---
  const TRACKS = {
    '23666480': '⚠️ اقفل DAMAGE'
  };

  const BANNER_ID = 'bosta-track-alert-banner-v1';

  function showBanner(text){
    removeBanner();
    const box = document.createElement('div');
    box.id = BANNER_ID;
    box.setAttribute('role','alert');
    box.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:2147483647',
      'background:#d32f2f',
      'color:#fff',
      'padding:12px 18px',
      'border-radius:10px',
      'font-size:18px',
      'font-weight:800',
      'font-family:Cairo, Arial, sans-serif',
      'display:flex',
      'align-items:center',
      'gap:12px',
      'box-shadow:0 10px 30px rgba(0,0,0,0.35)'
    ].join(';');
    const span = document.createElement('span');
    span.textContent = text;
    const hide = document.createElement('button');
    hide.textContent = 'إخفاء';
    hide.style.cssText = 'background:rgba(255,255,255,0.12);border:none;color:#fff;padding:6px 10px;border-radius:8px;cursor:pointer;font-weight:700';
    hide.addEventListener('click', ()=> box.remove());
    box.appendChild(span);
    box.appendChild(hide);
    (document.documentElement || document.body).appendChild(box);
    console.log('[BostaTrackAlerts] banner shown:', text);
  }

  function removeBanner(){
    const el = document.getElementById(BANNER_ID);
    if(el) el.remove();
  }

  function urlContainsTrackId(id){
    try {
      const url = location.href || '';
      if(url.indexOf('/fulfillment/returns/ro/')!==-1 && url.includes('/' + id)) return true;
      if(url.includes(id)) return true;
    } catch(e){}
    return false;
  }

  function bodyContainsTrackId(id){
    try {
      const whole = (document.body && document.body.innerText) ? document.body.innerText : '';
      if(whole.indexOf(id)!==-1) return true;
    } catch(e){}
    return false;
  }

  function findMatchingTrack(){
    try {
      for(const id of Object.keys(TRACKS)){
        if(urlContainsTrackId(id)) return id;
      }
      for(const id of Object.keys(TRACKS)){
        if(bodyContainsTrackId(id)) return id;
      }
    } catch(e){ console.error(e); }
    return null;
  }

  let lastMatched = null;
  function runCheck(){
    const matched = findMatchingTrack();
    if(matched){
      if(matched !== lastMatched){
        showBanner(TRACKS[matched]);
        lastMatched = matched;
      }
    } else {
      if(lastMatched !== null){
        removeBanner();
        lastMatched = null;
      }
    }
  }

  const mo = new MutationObserver(()=> runCheck());
  try {
    mo.observe(document.documentElement || document.body, { childList:true, subtree:true, characterData:true });
  } catch(e){
    console.warn('[BostaTrackAlerts] cannot observe document:', e);
  }

  (function(history){
    const push = history.pushState;
    history.pushState = function(){
      const res = push.apply(this, arguments);
      setTimeout(runCheck, 150);
      return res;
    };
  })(window.history);
  window.addEventListener('popstate', ()=> setTimeout(runCheck, 150));

  setTimeout(runCheck, 300);
  const interval = setInterval(runCheck, 2000);

  window._BostaTrackAlerts = { runCheck, findMatchingTrack, TRACKS };

})();
