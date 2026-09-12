/* =========================================================
   SYNTAX ARCADE — MOBILE CONTROLS
   Works with the existing Fractured Core keyboard controls.
========================================================= */

(() => {

  const canvas = document.getElementById("gameCanvas");

  if (!canvas) {
    console.warn("Mobile controls: gameCanvas not found.");
    return;
  }


  /* =======================================================
     DETECT TOUCH DEVICE
  ======================================================= */

  const isTouchDevice =
    window.matchMedia("(pointer: coarse)").matches ||
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0;


  if (!isTouchDevice) {
    return;
  }


  /* =======================================================
     MOBILE CSS
  ======================================================= */

  const style = document.createElement("style");

  style.textContent = `

    /* -----------------------------------------------
       RESPONSIVE GAME
    ------------------------------------------------ */

    #gameCanvas {
      display: block;
      width: 100% !important;
      height: auto !important;
      max-width: 100%;
    }

    .mobile-game-wrap {
      position: relative;
      width: 100%;
      max-width: 1280px;
      margin: 0 auto;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
      -webkit-touch-callout: none;
      overflow: hidden;
    }


    /* -----------------------------------------------
       TOUCH CONTROLS
    ------------------------------------------------ */

    .mobile-controls {
      position: absolute;
      inset: 0;
      z-index: 20;

      pointer-events: none;

      font-family:
        Arial,
        Helvetica,
        sans-serif;
    }


    .mobile-left,
    .mobile-right {
      position: absolute;
      bottom: max(14px, env(safe-area-inset-bottom));

      display: flex;
      align-items: flex-end;
      gap: 10px;

      pointer-events: none;
    }


    .mobile-left {
      left: max(14px, env(safe-area-inset-left));
    }


    .mobile-right {
      right: max(14px, env(safe-area-inset-right));
    }


    .mobile-action-column {
      display: flex;
      flex-direction: column;
      gap: 9px;
    }


    .mobile-btn {
      width: clamp(52px, 9vw, 82px);
      height: clamp(52px, 9vw, 82px);

      border-radius: 50%;
      border: 2px solid rgba(109, 242, 255, 0.75);

      background:
        rgba(6, 13, 35, 0.66);

      color: white;

      display: flex;
      align-items: center;
      justify-content: center;

      font-size: clamp(20px, 4vw, 34px);
      font-weight: 700;

      box-shadow:
        0 0 12px rgba(47, 225, 255, 0.3);

      backdrop-filter: blur(4px);

      pointer-events: auto;

      touch-action: none;

      user-select: none;
      -webkit-user-select: none;

      cursor: pointer;
    }


    .mobile-btn:active,
    .mobile-btn.mobile-active {
      background:
        rgba(43, 216, 255, 0.45);

      border-color:
        rgba(255, 255, 255, 0.95);

      transform:
        scale(0.94);
    }


    .mobile-btn-shoot {
      width: clamp(62px, 11vw, 94px);
      height: clamp(62px, 11vw, 94px);

      border-color:
        rgba(229, 89, 255, 0.9);

      box-shadow:
        0 0 14px rgba(215, 62, 255, 0.42);
    }


    .mobile-btn-jump {
      border-color:
        rgba(77, 255, 214, 0.85);
    }


    .mobile-btn-dash {
      width: clamp(46px, 7vw, 66px);
      height: clamp(46px, 7vw, 66px);

      font-size: clamp(12px, 2.2vw, 18px);
    }


    /* -----------------------------------------------
       SMALL TOP BUTTONS
    ------------------------------------------------ */

    .mobile-top-buttons {
      position: absolute;

      top: 10px;
      right: 10px;

      display: flex;
      gap: 8px;

      pointer-events: none;
    }


    .mobile-small-btn {
      min-width: 44px;
      height: 44px;

      padding: 0 12px;

      border-radius: 22px;

      border:
        1px solid rgba(100, 235, 255, 0.7);

      background:
        rgba(3, 8, 25, 0.75);

      color: white;

      font-size: 14px;
      font-weight: 700;

      pointer-events: auto;
      touch-action: manipulation;
    }


    /* -----------------------------------------------
       MOBILE DIFFICULTY SELECTOR
    ------------------------------------------------ */

    .mobile-difficulty {
      position: absolute;
      inset: 0;

      z-index: 30;

      display: flex;
      align-items: center;
      justify-content: center;

      padding: 20px;

      background:
        rgba(2, 5, 17, 0.72);

      backdrop-filter: blur(4px);

      pointer-events: auto;
    }


    .mobile-difficulty.hidden {
      display: none;
    }


    .mobile-difficulty-panel {
      width: min(520px, 92%);

      padding: 20px;

      border-radius: 16px;

      border:
        1px solid rgba(70, 226, 255, 0.6);

      background:
        rgba(4, 9, 28, 0.94);

      text-align: center;

      box-shadow:
        0 0 28px rgba(29, 208, 255, 0.18);
    }


    .mobile-difficulty-title {
      margin: 0 0 6px;

      color: #73f4ff;

      font-size: clamp(21px, 4vw, 30px);
      font-weight: 800;

      letter-spacing: 0.08em;
    }


    .mobile-difficulty-subtitle {
      margin: 0 0 16px;

      color: #cad6ed;

      font-size: 14px;
    }


    .mobile-difficulty-grid {
      display: grid;
      grid-template-columns:
        repeat(2, minmax(0, 1fr));

      gap: 10px;
    }


    .mobile-mode-btn {
      min-height: 58px;

      padding: 8px;

      border-radius: 10px;

      border:
        1px solid rgba(80, 225, 255, 0.55);

      background:
        rgba(11, 21, 48, 0.94);

      color: white;

      font-size: 15px;
      font-weight: 700;

      touch-action: manipulation;
    }


    .mobile-mode-btn span {
      display: block;

      margin-top: 4px;

      color: #acb9d4;

      font-size: 11px;
      font-weight: 400;
    }


    .mobile-mode-btn:active {
      background:
        rgba(40, 199, 230, 0.32);
    }


    /* -----------------------------------------------
       PORTRAIT ROTATE MESSAGE
    ------------------------------------------------ */

    .mobile-rotate {
      position: absolute;
      inset: 0;

      z-index: 50;

      display: none;
      align-items: center;
      justify-content: center;

      padding: 30px;

      background:
        rgba(2, 5, 18, 0.95);

      color: white;

      text-align: center;

      pointer-events: auto;
    }


    .mobile-rotate-icon {
      font-size: 46px;
      margin-bottom: 12px;
    }


    .mobile-rotate strong {
      display: block;

      color: #6ef1ff;

      font-size: 22px;

      margin-bottom: 8px;
    }


    .mobile-rotate p {
      margin: 0;

      color: #c4cce0;

      font-size: 14px;
    }


    @media
      (orientation: portrait)
      and
      (pointer: coarse) {

      .mobile-rotate {
        display: flex;
      }

    }


    /* -----------------------------------------------
       SMALL LANDSCAPE PHONES
    ------------------------------------------------ */

    @media
      (orientation: landscape)
      and
      (max-height: 550px) {

      .mobile-left,
      .mobile-right {
        bottom: 9px;
      }


      .mobile-btn {
        width: 54px;
        height: 54px;

        font-size: 22px;
      }


      .mobile-btn-shoot {
        width: 64px;
        height: 64px;
      }


      .mobile-btn-dash {
        width: 46px;
        height: 46px;

        font-size: 12px;
      }


      .mobile-top-buttons {
        top: 7px;
        right: 7px;
      }


      .mobile-small-btn {
        height: 38px;
        min-width: 38px;

        font-size: 12px;
      }


      .mobile-difficulty-panel {
        padding: 13px;
      }


      .mobile-difficulty-grid {
        gap: 7px;
      }


      .mobile-mode-btn {
        min-height: 48px;
      }

    }

  `;


  document.head.appendChild(style);


  /* =======================================================
     WRAP CANVAS
  ======================================================= */

  let wrap =
    canvas.parentElement;


  if (
    !wrap ||
    !wrap.classList.contains("mobile-game-wrap")
  ) {

    const newWrap =
      document.createElement("div");


    newWrap.className =
      "mobile-game-wrap";


    canvas.parentNode.insertBefore(
      newWrap,
      canvas
    );


    newWrap.appendChild(
      canvas
    );


    wrap =
      newWrap;

  }


  /* =======================================================
     CREATE CONTROLS
  ======================================================= */

  const controls =
    document.createElement("div");


  controls.className =
    "mobile-controls";


  controls.innerHTML = `

    <div class="mobile-top-buttons">

      <button
        class="mobile-small-btn"
        data-tap-code="KeyM"
        type="button"
        aria-label="Mute or unmute"
      >
        🔊
      </button>

      <button
        class="mobile-small-btn mobile-menu-btn"
        type="button"
        aria-label="Return to difficulty menu"
      >
        MENU
      </button>

    </div>


    <div class="mobile-left">

      <button
        class="mobile-btn"
        data-hold-code="ArrowLeft"
        type="button"
        aria-label="Move left"
      >
        ◀
      </button>

      <button
        class="mobile-btn"
        data-hold-code="ArrowRight"
        type="button"
        aria-label="Move right"
      >
        ▶
      </button>

    </div>


    <div class="mobile-right">

      <div class="mobile-action-column">

        <button
          class="mobile-btn mobile-btn-jump"
          data-hold-code="Space"
          type="button"
          aria-label="Jump"
        >
          ↑
        </button>

        <button
          class="mobile-btn mobile-btn-dash"
          data-tap-code="ShiftLeft"
          type="button"
          aria-label="Dash"
        >
          DASH
        </button>

      </div>


      <button
        class="mobile-btn mobile-btn-shoot"
        data-hold-code="KeyZ"
        type="button"
        aria-label="Shoot or hold to charge"
      >
        ✦
      </button>

    </div>

  `;


  wrap.appendChild(
    controls
  );


  /* =======================================================
     DIFFICULTY OVERLAY
  ======================================================= */

  const difficulty =
    document.createElement("div");


  difficulty.className =
    "mobile-difficulty";


  difficulty.innerHTML = `

    <div class="mobile-difficulty-panel">

      <div class="mobile-difficulty-title">
        FRACTURED CORE
      </div>

      <div class="mobile-difficulty-subtitle">
        Select difficulty
      </div>


      <div class="mobile-difficulty-grid">

        <button
          class="mobile-mode-btn"
          data-mode-code="Digit1"
          type="button"
        >
          PRACTICE
          <span>Unlimited health</span>
        </button>


        <button
          class="mobile-mode-btn"
          data-mode-code="Digit2"
          type="button"
        >
          EASY
          <span>8 hearts</span>
        </button>


        <button
          class="mobile-mode-btn"
          data-mode-code="Digit3"
          type="button"
        >
          MEDIUM
          <span>5 hearts</span>
        </button>


        <button
          class="mobile-mode-btn"
          data-mode-code="Digit4"
          type="button"
        >
          HARD
          <span>3 hearts</span>
        </button>

      </div>

    </div>

  `;


  wrap.appendChild(
    difficulty
  );


  /* =======================================================
     ROTATE MESSAGE
  ======================================================= */

  const rotate =
    document.createElement("div");


  rotate.className =
    "mobile-rotate";


  rotate.innerHTML = `

    <div>

      <div class="mobile-rotate-icon">
        ↻ 📱
      </div>

      <strong>
        Rotate your phone
      </strong>

      <p>
        Fractured Core plays best in landscape.
      </p>

    </div>

  `;


  wrap.appendChild(
    rotate
  );


  /* =======================================================
     KEY EVENT HELPERS
  ======================================================= */

  function keyDown(code) {

    window.dispatchEvent(

      new KeyboardEvent(
        "keydown",
        {
          code,
          key:
            code,
          bubbles:
            true
        }
      )

    );

  }


  function keyUp(code) {

    window.dispatchEvent(

      new KeyboardEvent(
        "keyup",
        {
          code,
          key:
            code,
          bubbles:
            true
        }
      )

    );

  }


  function tapKey(code) {

    keyDown(code);


    setTimeout(
      () => {

        keyUp(code);

      },
      45
    );

  }


  /* =======================================================
     HOLD BUTTONS
     Supports simultaneous movement + jump + shooting.
  ======================================================= */

  controls
    .querySelectorAll(
      "[data-hold-code]"
    )
    .forEach(
      button => {

        const code =
          button.dataset.holdCode;


        const release = () => {

          keyUp(code);


          button.classList.remove(
            "mobile-active"
          );

        };


        button.addEventListener(
          "pointerdown",
          event => {

            event.preventDefault();


            try {

              button.setPointerCapture(
                event.pointerId
              );

            }

            catch (_) {}


            keyDown(code);


            button.classList.add(
              "mobile-active"
            );

          }
        );


        button.addEventListener(
          "pointerup",
          event => {

            event.preventDefault();


            release();

          }
        );


        button.addEventListener(
          "pointercancel",
          release
        );


        button.addEventListener(
          "lostpointercapture",
          release
        );

      }
    );


  /* =======================================================
     TAP BUTTONS
  ======================================================= */

  controls
    .querySelectorAll(
      "[data-tap-code]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "pointerdown",
          event => {

            event.preventDefault();


            tapKey(
              button.dataset.tapCode
            );

          }
        );

      }
    );


  /* =======================================================
     DIFFICULTY BUTTONS
  ======================================================= */

  difficulty
    .querySelectorAll(
      "[data-mode-code]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "pointerdown",
          event => {

            event.preventDefault();


            tapKey(
              button.dataset.modeCode
            );


            difficulty.classList.add(
              "hidden"
            );

          }
        );

      }
    );


  /* =======================================================
     MENU BUTTON
  ======================================================= */

  const menuButton =
    controls.querySelector(
      ".mobile-menu-btn"
    );


  menuButton.addEventListener(
    "pointerdown",
    event => {

      event.preventDefault();


      tapKey(
        "Escape"
      );


      setTimeout(
        () => {

          difficulty.classList.remove(
            "hidden"
          );

        },
        80
      );

    }
  );


  /* =======================================================
     PREVENT LONG-PRESS MENU
  ======================================================= */

  wrap.addEventListener(
    "contextmenu",
    event => {

      event.preventDefault();

    }
  );


  /* =======================================================
     SAFETY — RELEASE KEYS IF APP LOSES FOCUS
  ======================================================= */

  window.addEventListener(
    "blur",
    () => {

      [
        "ArrowLeft",
        "ArrowRight",
        "Space",
        "KeyZ",
        "ShiftLeft"
      ]
      .forEach(
        keyUp
      );

    }
  );


})();
