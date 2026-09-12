/* =========================================================
   SYNTAX ARCADE — MOBILE CONTROLS
   FRACTURED CORE

   Adds:
   - Responsive phone sizing
   - Landscape support
   - Left / right controls
   - Jump
   - Shoot + hold-to-charge
   - Dash
   - Mute
   - Menu
   - Tap difficulty selection
   - Multi-touch support
========================================================= */

(() => {

  const canvas =
    document.getElementById("gameCanvas");


  if (!canvas) {

    console.warn(
      "Mobile controls: gameCanvas not found."
    );

    return;

  }


  /* =======================================================
     DETECT TOUCH DEVICE
  ======================================================= */

  const isTouchDevice =

    window.matchMedia(
      "(pointer: coarse)"
    ).matches

    ||

    "ontouchstart" in window

    ||

    navigator.maxTouchPoints > 0;


  if (!isTouchDevice) {

    return;

  }


  /* =======================================================
     VIEWPORT
  ======================================================= */

  let viewportMeta =
    document.querySelector(
      'meta[name="viewport"]'
    );


  if (!viewportMeta) {

    viewportMeta =
      document.createElement("meta");

    viewportMeta.name =
      "viewport";

    document.head.appendChild(
      viewportMeta
    );

  }


  viewportMeta.content =
    "width=device-width, initial-scale=1, viewport-fit=cover";


  /* =======================================================
     MOBILE CSS
  ======================================================= */

  const style =
    document.createElement("style");


  style.textContent = `

    html,
    body {
      overscroll-behavior: none;
    }


    #gameCanvas {
      display: block;

      width: 100% !important;
      height: 100% !important;

      max-width: none !important;
      max-height: none !important;

      object-fit: contain;

      touch-action: none;

      user-select: none;
      -webkit-user-select: none;
      -webkit-touch-callout: none;
    }


    .mobile-game-wrap {
      position: relative;

      margin-left: auto;
      margin-right: auto;

      overflow: hidden;

      touch-action: none;

      user-select: none;
      -webkit-user-select: none;
      -webkit-touch-callout: none;

      background: #050816;
    }


    /* =====================================================
       MAIN TOUCH CONTROLS
    ====================================================== */

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

      bottom:
        max(
          10px,
          env(safe-area-inset-bottom)
        );

      display: flex;

      align-items: flex-end;

      gap: 10px;

      pointer-events: none;
    }


    .mobile-left {
      left:
        max(
          12px,
          env(safe-area-inset-left)
        );
    }


    .mobile-right {
      right:
        max(
          12px,
          env(safe-area-inset-right)
        );
    }


    .mobile-action-column {
      display: flex;

      flex-direction: column;

      gap: 8px;
    }


    .mobile-btn {
      width: clamp(
        52px,
        9vw,
        82px
      );

      height: clamp(
        52px,
        9vw,
        82px
      );

      padding: 0;

      border-radius: 50%;

      border:
        2px solid
        rgba(
          109,
          242,
          255,
          0.76
        );

      background:
        rgba(
          6,
          13,
          35,
          0.62
        );

      color: white;

      display: flex;

      align-items: center;

      justify-content: center;

      font-size: clamp(
        20px,
        4vw,
        34px
      );

      font-weight: 700;

      box-shadow:
        0 0 12px
        rgba(
          47,
          225,
          255,
          0.30
        );

      backdrop-filter:
        blur(4px);

      -webkit-backdrop-filter:
        blur(4px);

      pointer-events: auto;

      touch-action: none;

      user-select: none;
      -webkit-user-select: none;
      -webkit-touch-callout: none;

      -webkit-tap-highlight-color:
        transparent;

      cursor: pointer;
    }


    .mobile-btn:active,
    .mobile-btn.mobile-active {
      background:
        rgba(
          43,
          216,
          255,
          0.46
        );

      border-color:
        rgba(
          255,
          255,
          255,
          0.96
        );

      transform:
        scale(0.94);
    }


    .mobile-btn-shoot {
      width: clamp(
        62px,
        11vw,
        94px
      );

      height: clamp(
        62px,
        11vw,
        94px
      );

      border-color:
        rgba(
          229,
          89,
          255,
          0.90
        );

      box-shadow:
        0 0 14px
        rgba(
          215,
          62,
          255,
          0.42
        );
    }


    .mobile-btn-jump {
      border-color:
        rgba(
          77,
          255,
          214,
          0.86
        );
    }


    .mobile-btn-dash {
      width: clamp(
        46px,
        7vw,
        66px
      );

      height: clamp(
        46px,
        7vw,
        66px
      );

      font-size: clamp(
        11px,
        2.2vw,
        17px
      );
    }


    /* =====================================================
       TOP BUTTONS
    ====================================================== */

    .mobile-top-buttons {
      position: absolute;

      top: 8px;

      right:
        max(
          8px,
          env(safe-area-inset-right)
        );

      display: flex;

      gap: 7px;

      pointer-events: none;
    }


    .mobile-small-btn {
      min-width: 44px;

      height: 42px;

      padding:
        0 11px;

      border-radius:
        21px;

      border:
        1px solid
        rgba(
          100,
          235,
          255,
          0.72
        );

      background:
        rgba(
          3,
          8,
          25,
          0.72
        );

      color:
        white;

      font-size:
        13px;

      font-weight:
        700;

      pointer-events:
        auto;

      touch-action:
        manipulation;

      user-select:
        none;

      -webkit-tap-highlight-color:
        transparent;
    }


    /* =====================================================
       DIFFICULTY SCREEN
    ====================================================== */

    .mobile-difficulty {
      position: absolute;

      inset: 0;

      z-index: 30;

      display: flex;

      align-items: center;

      justify-content: center;

      padding: 15px;

      box-sizing: border-box;

      background:
        rgba(
          2,
          5,
          17,
          0.74
        );

      backdrop-filter:
        blur(4px);

      -webkit-backdrop-filter:
        blur(4px);

      pointer-events: auto;
    }


    .mobile-difficulty.hidden {
      display: none;
    }


    .mobile-difficulty-panel {
      width:
        min(
          520px,
          92%
        );

      max-height:
        94%;

      box-sizing:
        border-box;

      padding:
        17px;

      border-radius:
        15px;

      border:
        1px solid
        rgba(
          70,
          226,
          255,
          0.62
        );

      background:
        rgba(
          4,
          9,
          28,
          0.95
        );

      text-align:
        center;
    }


    .mobile-difficulty-title {
      margin:
        0 0 5px;

      color:
        #73f4ff;

      font-size:
        clamp(
          20px,
          4vw,
          29px
        );

      font-weight:
        800;

      letter-spacing:
        0.08em;
    }


    .mobile-difficulty-subtitle {
      margin:
        0 0 13px;

      color:
        #cad6ed;

      font-size:
        14px;
    }


    .mobile-difficulty-grid {
      display:
        grid;

      grid-template-columns:
        repeat(
          2,
          minmax(0, 1fr)
        );

      gap:
        9px;
    }


    .mobile-mode-btn {
      min-height:
        56px;

      padding:
        7px;

      border-radius:
        10px;

      border:
        1px solid
        rgba(
          80,
          225,
          255,
          0.55
        );

      background:
        rgba(
          11,
          21,
          48,
          0.94
        );

      color:
        white;

      font-size:
        15px;

      font-weight:
        700;

      touch-action:
        manipulation;

      -webkit-tap-highlight-color:
        transparent;
    }


    .mobile-mode-btn span {
      display:
        block;

      margin-top:
        3px;

      color:
        #acb9d4;

      font-size:
        11px;

      font-weight:
        400;
    }


    .mobile-mode-btn:active {
      background:
        rgba(
          40,
          199,
          230,
          0.32
        );
    }


    /* =====================================================
       PORTRAIT ROTATION NOTICE
    ====================================================== */

    .mobile-rotate {
      position: absolute;

      inset: 0;

      z-index: 50;

      display: none;

      align-items: center;

      justify-content: center;

      box-sizing: border-box;

      padding: 30px;

      background:
        rgba(
          2,
          5,
          18,
          0.97
        );

      color:
        white;

      text-align:
        center;

      pointer-events:
        auto;
    }


    .mobile-rotate-icon {
      margin-bottom:
        10px;

      font-size:
        44px;
    }


    .mobile-rotate strong {
      display:
        block;

      margin-bottom:
        7px;

      color:
        #6ef1ff;

      font-size:
        22px;
    }


    .mobile-rotate p {
      margin:
        0;

      color:
        #c4cce0;

      font-size:
        14px;
    }


    @media
      (orientation: portrait)
      and
      (pointer: coarse) {

      .mobile-rotate {
        display:
          flex;
      }

    }


    /* =====================================================
       SHORT LANDSCAPE PHONE
    ====================================================== */

    @media
      (orientation: landscape)
      and
      (max-height: 550px) {

      .mobile-left,
      .mobile-right {
        bottom:
          max(
            6px,
            env(safe-area-inset-bottom)
          );
      }


      .mobile-btn {
        width:
          50px;

        height:
          50px;

        font-size:
          21px;
      }


      .mobile-btn-shoot {
        width:
          62px;

        height:
          62px;
      }


      .mobile-btn-dash {
        width:
          44px;

        height:
          44px;

        font-size:
          11px;
      }


      .mobile-top-buttons {
        top:
          5px;
      }


      .mobile-small-btn {
        min-width:
          38px;

        height:
          36px;

        padding:
          0 8px;

        font-size:
          11px;
      }


      .mobile-difficulty-panel {
        padding:
          10px;
      }


      .mobile-difficulty-title {
        font-size:
          20px;
      }


      .mobile-difficulty-subtitle {
        margin-bottom:
          8px;

        font-size:
          12px;
      }


      .mobile-difficulty-grid {
        gap:
          6px;
      }


      .mobile-mode-btn {
        min-height:
          44px;

        padding:
          4px;

        font-size:
          13px;
      }


      .mobile-mode-btn span {
        font-size:
          10px;
      }

    }

  `;


  document.head.appendChild(
    style
  );


  /* =======================================================
     WRAP GAME CANVAS
  ======================================================= */

  let wrap =
    canvas.parentElement;


  if (
    !wrap

    ||

    !wrap.classList.contains(
      "mobile-game-wrap"
    )
  ) {

    const newWrap =
      document.createElement(
        "div"
      );


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
     CREATE TOUCH CONTROLS
  ======================================================= */

  const controls =
    document.createElement(
      "div"
    );


  controls.className =
    "mobile-controls";


  controls.innerHTML = `

    <div class="mobile-top-buttons">

      <button
        class="mobile-small-btn"
        data-tap-code="KeyM"
        type="button"
        aria-label="Mute or unmute audio"
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
     MOBILE DIFFICULTY SELECTOR
  ======================================================= */

  const difficulty =
    document.createElement(
      "div"
    );


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
          <span>
            Unlimited health
          </span>
        </button>


        <button
          class="mobile-mode-btn"
          data-mode-code="Digit2"
          type="button"
        >
          EASY
          <span>
            8 hearts
          </span>
        </button>


        <button
          class="mobile-mode-btn"
          data-mode-code="Digit3"
          type="button"
        >
          MEDIUM
          <span>
            5 hearts
          </span>
        </button>


        <button
          class="mobile-mode-btn"
          data-mode-code="Digit4"
          type="button"
        >
          HARD
          <span>
            3 hearts
          </span>
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
    document.createElement(
      "div"
    );


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
     KEY HELPERS
  ======================================================= */

  function keyDown(
    code
  ) {

    window.dispatchEvent(

      new KeyboardEvent(

        "keydown",

        {

          code:
            code,

          key:
            code,

          bubbles:
            true

        }

      )

    );

  }


  function keyUp(
    code
  ) {

    window.dispatchEvent(

      new KeyboardEvent(

        "keyup",

        {

          code:
            code,

          key:
            code,

          bubbles:
            true

        }

      )

    );

  }


  function tapKey(
    code
  ) {

    keyDown(
      code
    );


    setTimeout(
      () => {

        keyUp(
          code
        );

      },

      55
    );

  }


  /* =======================================================
     HOLD CONTROLS
  ======================================================= */

  controls
    .querySelectorAll(
      "[data-hold-code]"
    )
    .forEach(
      button => {

        const code =
          button.dataset.holdCode;


        const release =
          () => {

            keyUp(
              code
            );


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

            catch (error) {}


            keyDown(
              code
            );


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
     TAP CONTROLS
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
     RELEASE CONTROLS IF PAGE LOSES FOCUS
  ======================================================= */

  function releaseAllControls() {

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


    controls
      .querySelectorAll(
        ".mobile-active"
      )
      .forEach(
        button => {

          button.classList.remove(
            "mobile-active"
          );

        }
      );

  }


  window.addEventListener(
    "blur",
    releaseAllControls
  );


  document.addEventListener(
    "visibilitychange",
    () => {

      if (
        document.hidden
      ) {

        releaseAllControls();

      }

    }
  );


  /* =======================================================
     FIT GAME TO VISIBLE PHONE SCREEN

     Keeps the full 1280 × 720 canvas visible.
     Uses whichever limit is reached first:
     width OR remaining screen height.
  ======================================================= */

  function fitGameToScreen() {

    const viewportWidth =

      window.visualViewport

        ? window.visualViewport.width

        : window.innerWidth;


    const viewportHeight =

      window.visualViewport

        ? window.visualViewport.height

        : window.innerHeight;


    /*
      The game may sit underneath the existing
      Syntax Arcade HUD, so calculate how much
      vertical room remains from the top of the
      game container.
    */

    const rect =
      wrap.getBoundingClientRect();


    const topOffset =

      Math.max(
        0,
        rect.top
      );


    const availableWidth =

      Math.max(

        100,

        viewportWidth -
        8

      );


    const availableHeight =

      Math.max(

        100,

        viewportHeight -
        topOffset -
        6

      );


    /*
      Game is 1280 × 720.
    */

    const gameRatio =

      1280 /
      720;


    let gameWidth =
      availableWidth;


    let gameHeight =

      gameWidth /
      gameRatio;


    /*
      If fitting by width makes the canvas
      too tall, fit by height instead.
    */

    if (
      gameHeight >
      availableHeight
    ) {

      gameHeight =
        availableHeight;


      gameWidth =

        gameHeight

        *

        gameRatio;

    }


    gameWidth =

      Math.max(
        1,
        Math.floor(
          gameWidth
        )
      );


    gameHeight =

      Math.max(
        1,
        Math.floor(
          gameHeight
        )
      );


    wrap.style.width =
      `${gameWidth}px`;


    wrap.style.height =
      `${gameHeight}px`;


    canvas.style.width =
      "100%";


    canvas.style.height =
      "100%";


    /*
      Keep the game centered if it has
      to shrink because of screen height.
    */

    wrap.style.marginLeft =
      "auto";


    wrap.style.marginRight =
      "auto";

  }


  /* =======================================================
     RUN FIT
  ======================================================= */

  fitGameToScreen();


  /*
    Mobile browser bars often change size
    shortly after the page first opens.
  */

  setTimeout(
    fitGameToScreen,
    100
  );


  setTimeout(
    fitGameToScreen,
    400
  );


  setTimeout(
    fitGameToScreen,
    900
  );


  /* =======================================================
     REFIT WHEN SCREEN CHANGES
  ======================================================= */

  window.addEventListener(
    "resize",
    fitGameToScreen
  );


  window.addEventListener(
    "orientationchange",
    () => {

      releaseAllControls();


      setTimeout(
        fitGameToScreen,
        100
      );


      setTimeout(
        fitGameToScreen,
        400
      );

    }
  );


  if (
    window.visualViewport
  ) {

    window.visualViewport.addEventListener(
      "resize",
      fitGameToScreen
    );


    window.visualViewport.addEventListener(
      "scroll",
      fitGameToScreen
    );

  }


})();
