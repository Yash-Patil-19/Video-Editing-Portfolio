(() => {
  "use strict";

  if (window.__portfolioMotionInitialized) return;
  window.__portfolioMotionInitialized = true;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Select key DOM elements
  const navWrap = document.querySelector(".nav-wrap");
  const nav = document.querySelector(".nav-links");
  const menuToggle = document.querySelector(".menu-toggle");
  const backToTopBtn = document.getElementById("back-to-top");
  const cursorGlow = document.getElementById("cursor-glow");
  const projectDialog = document.getElementById("project-dialog");
  const reelDialog = document.getElementById("reel-dialog");
  const cards = [...document.querySelectorAll(".project-card")];
  const filterGroup = document.querySelector(".filters");
  const sections = [...document.querySelectorAll(".section")];
  let lastDialogTrigger = null;

  // Split and setup category filters
  const motionFilter = filterGroup?.querySelector('[data-filter="motion"]');
  if (motionFilter) {
    motionFilter.textContent = "Motion Graphics";
    const brandFilter = document.createElement("button");
    brandFilter.type = "button";
    brandFilter.className = "filter";
    brandFilter.dataset.filter = "brand";
    brandFilter.textContent = "Commercials & Brand";
    motionFilter.insertAdjacentElement("afterend", brandFilter);
  }

  const brandCard = cards.find((card) => (card.dataset.title || "").toLowerCase().includes("brand & social"));
  if (brandCard) {
    brandCard.dataset.category = "brand";
    brandCard.dataset.type = "COMMERCIALS & BRAND";
    const typeLabel = brandCard.querySelector(".project-type");
    if (typeLabel) typeLabel.textContent = "COMMERCIALS & BRAND";
  }

  const filters = [...document.querySelectorAll("[data-filter]")];
  filters.forEach((button) => {
    let countLabel = button.querySelector("[data-filter-count]");
    if (!countLabel) {
      countLabel = button.querySelector("span") || document.createElement("span");
      countLabel.dataset.filterCount = "true";
      countLabel.setAttribute("aria-hidden", "true");
      if (!countLabel.isConnected) button.appendChild(countLabel);
    }
  });

  const updateFilterCounts = () => {
    filters.forEach((button) => {
      const selected = button.dataset.filter;
      const count = selected === "all" ? cards.length : cards.filter((card) => card.dataset.category === selected).length;
      const countLabel = button.querySelector("[data-filter-count]");
      if (countLabel) countLabel.textContent = String(count).padStart(2, "0");
      button.setAttribute("aria-pressed", String(button.classList.contains("active")));
    });
  };

  const applyFilter = (selected) => {
    filters.forEach((button) => {
      const active = button.dataset.filter === selected;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    cards.forEach((card) => {
      const visible = selected === "all" || card.dataset.category === selected;
      if (visible) {
        card.classList.remove("hidden");
        card.removeAttribute("inert");
        card.setAttribute("aria-hidden", "false");
        window.requestAnimationFrame(() => {
          card.style.opacity = "1";
          card.style.transform = "";
        });
      } else {
        card.style.opacity = "0";
        card.style.transform = "scale(0.96)";
        setTimeout(() => {
          if (card.dataset.category !== selected && selected !== "all") {
            card.classList.add("hidden");
            card.setAttribute("inert", "");
            card.setAttribute("aria-hidden", "true");
          }
        }, 220);
      }
    });

    updateFilterCounts();
  };

  filters.forEach((button) => button.addEventListener("click", () => applyFilter(button.dataset.filter)));
  applyFilter(document.querySelector(".filter.active")?.dataset.filter || "all");

  // Modal dialog logic
  const openDialog = (dialog, trigger) => {
    if (!dialog || typeof dialog.showModal !== "function") return;
    lastDialogTrigger = trigger;
    dialog.showModal();
    dialog.querySelector(".dialog-close")?.focus();
  };

  // Universal Media Renderer (supports local video/image, Drive, YouTube, Vimeo)
  const renderMedia = (container, videoUrl, posterUrl) => {
    container.replaceChildren();

    if (!videoUrl && !posterUrl) {
      const label = document.createElement("span");
      label.textContent = "PROJECT MEDIA PLACEHOLDER";
      const hint = document.createElement("small");
      hint.textContent = "Add data-poster or data-video to this project card when real media is available.";
      container.append(label, hint);
      return;
    }

    // Google Drive Preview URL parser
    if (videoUrl && videoUrl.includes("drive.google.com")) {
      const match = videoUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      const fileId = match ? match[1] : null;
      if (fileId) {
        const iframe = document.createElement("iframe");
        iframe.src = `https://drive.google.com/file/d/${fileId}/preview`;
        iframe.allow = "autoplay; encrypted-media";
        iframe.allowFullscreen = true;
        container.appendChild(iframe);
        return;
      }
    }

    // YouTube parser
    if (videoUrl && (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be"))) {
      let ytId = "";
      if (videoUrl.includes("youtu.be/")) {
        ytId = videoUrl.split("youtu.be/")[1]?.split("?")[0];
      } else if (videoUrl.includes("watch?v=")) {
        ytId = new URL(videoUrl).searchParams.get("v");
      }
      if (ytId) {
        const iframe = document.createElement("iframe");
        iframe.src = `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`;
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        container.appendChild(iframe);
        return;
      }
    }

    // Vimeo parser
    if (videoUrl && videoUrl.includes("vimeo.com")) {
      const match = videoUrl.match(/vimeo\.com\/(\d+)/);
      const vimeoId = match ? match[1] : null;
      if (vimeoId) {
        const iframe = document.createElement("iframe");
        iframe.src = `https://player.vimeo.com/video/${vimeoId}?autoplay=1`;
        iframe.allow = "autoplay; fullscreen; picture-in-picture";
        iframe.allowFullscreen = true;
        container.appendChild(iframe);
        return;
      }
    }

    // Local / direct video file
    if (videoUrl) {
      const video = document.createElement("video");
      video.controls = true;
      video.playsInline = true;
      video.autoplay = true;
      video.preload = "metadata";
      if (posterUrl) video.poster = posterUrl;
      const source = document.createElement("source");
      source.src = videoUrl;
      source.type = /\.webm(?:$|\?)/i.test(videoUrl) ? "video/webm" : "video/mp4";
      video.appendChild(source);
      video.addEventListener("error", () => {
        const fallback = document.createElement("p");
        fallback.className = "media-fallback";
        fallback.textContent = "This video preview could not be loaded. Please verify the file path or link.";
        container.replaceChildren(fallback);
      }, { once: true });
      container.appendChild(video);
      return;
    }

    // Poster image fallback
    if (posterUrl) {
      const image = document.createElement("img");
      image.src = posterUrl;
      image.alt = "Project preview";
      image.loading = "lazy";
      container.appendChild(image);
    }
  };

  document.querySelectorAll(".project-open").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".project-card");
      document.getElementById("dialog-title").textContent = card.dataset.title || "Project";
      document.getElementById("dialog-type").textContent = card.dataset.type || "PROJECT";
      document.getElementById("dialog-desc").textContent = card.dataset.desc || "";
      const media = projectDialog?.querySelector(".dialog-placeholder");
      if (media) {
        renderMedia(media, card.dataset.video, card.dataset.poster);
      }
      openDialog(projectDialog, button);
    });
  });

  const reelCard = document.querySelector(".showreel-card");
  const openShowreelModal = (trigger) => {
    const media = reelDialog?.querySelector(".dialog-placeholder");
    if (media) {
      renderMedia(media, reelCard?.dataset.video, reelCard?.dataset.poster);
    }
    openDialog(reelDialog, trigger || reelCard);
  };

  reelCard?.addEventListener("click", (event) => {
    openShowreelModal(event.target.closest("button") || reelCard);
  });

  document.querySelectorAll(".dialog-close").forEach((button) => {
    button.addEventListener("click", () => button.closest("dialog")?.close());
  });

  [projectDialog, reelDialog].filter(Boolean).forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", () => {
      dialog.querySelectorAll("video").forEach((video) => {
        video.pause();
        video.removeAttribute("src");
        video.querySelectorAll("source").forEach((source) => source.removeAttribute("src"));
        video.load();
      });
      dialog.querySelectorAll("iframe").forEach((iframe) => {
        iframe.src = "";
      });
      if (lastDialogTrigger?.isConnected) lastDialogTrigger.focus();
      lastDialogTrigger = null;
    });
  });

  // Mobile menu
  const closeMenu = ({ restoreFocus = false } = {}) => {
    if (!menuToggle || !nav) return;
    nav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    if (restoreFocus) menuToggle.focus();
  };

  menuToggle?.addEventListener("click", () => {
    const open = nav?.classList.toggle("open") ?? false;
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    if (open) nav.querySelector("a")?.focus({ preventScroll: true });
  });

  nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => closeMenu()));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav?.classList.contains("open")) closeMenu({ restoreFocus: true });
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 800) closeMenu();
  }, { passive: true });

  // Smooth scroll reveals (Observer Progressive Enhancement)
  const revealTargets = document.querySelectorAll(
    ".hero-copy, .hero-stage, .section-heading, .project-card, .service-row, .process-card, .about-art, .about-copy, .contact > *"
  );

  if (!reducedMotion.matches && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

    revealTargets.forEach((element, index) => {
      element.classList.add("will-reveal");
      element.style.setProperty("--reveal-delay", (Math.min(index % 4, 3) * 80) + "ms");
      revealObserver.observe(element);
    });
    window.addEventListener("pagehide", () => revealObserver.disconnect(), { once: true });
  } else {
    revealTargets.forEach((element) => element.classList.add("is-visible"));
  }

  // Bidirectional Dynamic Scroll Effects
  let scrollTicking = false;
  let lastScrollY = window.scrollY;

  const onScrollUpdate = () => {
    const currentScrollY = window.scrollY;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? (currentScrollY / scrollable) * 100 : 0;

    // Progress bar width
    document.documentElement.style.setProperty("--scroll-progress", `${progress.toFixed(2)}%`);

    // Dynamic navbar state
    if (navWrap) {
      if (currentScrollY > 40) {
        navWrap.classList.add("scrolled");
      } else {
        navWrap.classList.remove("scrolled");
      }
    }

    // Floating back-to-top button
    if (backToTopBtn) {
      if (currentScrollY > 450) {
        backToTopBtn.classList.add("is-active");
      } else {
        backToTopBtn.classList.remove("is-active");
      }
    }

    // Subtle parallax shift on stage art and monogram
    if (!reducedMotion.matches) {
      document.querySelectorAll(".stage-art, .about-monogram").forEach((element) => {
        const rect = element.getBoundingClientRect();
        const distance = (rect.top + rect.height / 2 - window.innerHeight * 0.5) / Math.max(window.innerHeight, 1);
        const offset = Math.max(-20, Math.min(20, distance * -16));
        element.style.setProperty("--scroll-shift", `${offset.toFixed(2)}px`);
      });
    }

    lastScrollY = currentScrollY;
    scrollTicking = false;
  };

  const handleScroll = () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(onScrollUpdate);
      scrollTicking = true;
    }
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", handleScroll, { passive: true });
  onScrollUpdate();

  // Back to top click event
  backToTopBtn?.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });

  // Dynamic Aesthetic Cursor Follower with Spring Lag
  if (cursorGlow && !reducedMotion.matches && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let curX = mouseX;
    let curY = mouseY;
    let isMoving = false;

    window.addEventListener("pointermove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isMoving) {
        isMoving = true;
        cursorGlow.style.opacity = "1";
      }
    }, { passive: true });

    document.addEventListener("mouseleave", () => {
      cursorGlow.style.opacity = "0";
      isMoving = false;
    });

    const renderCursor = () => {
      // Lerp for buttery smooth lag
      curX += (mouseX - curX) * 0.12;
      curY += (mouseY - curY) * 0.12;
      cursorGlow.style.transform = `translate3d(${curX}px, ${curY}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(renderCursor);
    };
    renderCursor();
  }

  // 3D Tilt effect on project cards
  if (!reducedMotion.matches && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    cards.forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        card.style.setProperty("--tilt-x", `${((0.5 - y) * 6).toFixed(2)}deg`);
        card.style.setProperty("--tilt-y", `${((x - 0.5) * 6).toFixed(2)}deg`);
      });

      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--tilt-x", "0deg");
        card.style.setProperty("--tilt-y", "0deg");
      });
    });
  }

  // Active navigation section indicator
  if ("IntersectionObserver" in window && sections.length > 0) {
    const navAnchors = [...(nav?.querySelectorAll('a[href^="#"]') || [])];
    const activeObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navAnchors.forEach((anchor) => {
          if (anchor.hash === "#" + entry.target.id) {
            anchor.setAttribute("aria-current", "location");
          } else {
            anchor.removeAttribute("aria-current");
          }
        });
      });
    }, { rootMargin: "-20% 0px -60% 0px" });

    sections.forEach((section) => activeObserver.observe(section));
    window.addEventListener("pagehide", () => activeObserver.disconnect(), { once: true });
  }

  // Studio Assistant Chatbot Logic
  const chatWidget = document.getElementById("chat-widget");
  const chatToggle = document.getElementById("chat-toggle");
  const chatPanel = document.getElementById("chat-panel");
  const chatMessages = document.getElementById("chat-messages");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const chatResetBtn = document.getElementById("chat-reset-btn");
  const chatCloseBtn = document.getElementById("chat-close-btn");
  const quickChipsWrap = document.getElementById("chat-quick-chips");

  if (chatWidget && chatToggle && chatPanel && chatMessages) {
    let isChatOpen = false;
    let isBotTyping = false;
    const avatarUrl = "assets/projects/bot-avatar.png?v=1";

    // Conversational Context & Memory
    const memory = {
      lastTopic: null,
      turnCount: 0,
      replyIndices: {}
    };

    // Default main menu suggested topics
    const defaultChips = [
      { label: "🎬 Short-Form Reels", intent: "reels_creative" },
      { label: "🎥 YouTube & Long Cuts", intent: "youtube_creative" },
      { label: "⏱️ Delivery Times", intent: "turnaround" },
      { label: "💰 Pricing & Retainers", intent: "pricing_general" },
      { label: "⚡ Hormozi Style Edits", intent: "style_hormozi" },
      { label: "🛠️ Editing Software", intent: "software_tools" },
      { label: "🔄 Revisions Policy", intent: "revisions_policy" },
      { label: "📬 Book Yash Directly", intent: "contact_booking" }
    ];

    // High-Intelligence Knowledge Base with Weighted Scoring & Dynamic Variations
    const knowledgeBase = [
      // 1. REELS PRICING (Compound Specific)
      {
        id: "reels_pricing",
        topic: "reels",
        phrases: ["reels price", "reel price", "reels cost", "reel rate", "how much for reels", "how much for a reel", "short form price", "cost of reels", "reels retainer", "reel pricing"],
        keywords: ["price", "cost", "rate", "quote", "charge", "package", "fee"],
        requiredTopicWords: ["reel", "reels", "short", "shorts", "tiktok", "instagram"],
        replies: [
          `
            <p>For <strong>short-form reels & shorts</strong>, Yash offers both per-video rates and discounted monthly packages for creators:</p>
            <ul>
              <li><strong>Single Custom Edit:</strong> Tailored pricing based on pacing, footage duration, and kinetic motion complexity.</li>
              <li><strong>Monthly Creator Retainers (10, 15, or 30 reels/month):</strong> Cost-effective bundles with guaranteed turnaround and consistent visual identity.</li>
            </ul>
            <p>Every reel includes retention hooks, kinetic typography, and synchronized sound design.</p>
            <div>
              <a class="chat-cta-btn" href="mailto:yp.atil2040@gmail.com?subject=Short-Form%20Reels%20Pricing%20Enquiry">✉️ Request a Reels Quote</a>
              <button type="button" class="chat-cta-btn" data-card-idx="0">🎬 Watch Retention Edit</button>
            </div>
          `,
          `
            <p>Yash’s pricing for <strong>reels and viral short-form content</strong> is designed for high ROI and retention. Rates vary by whether you need single standalone reels or recurring batch production.</p>
            <p>Batch orders (e.g. 8–15 reels per month) receive prioritized scheduling and discounted per-reel rates.</p>
            <div>
              <a class="chat-cta-btn" href="mailto:yp.atil2040@gmail.com?subject=Reels%20Package%20Quote">📬 Get an Instant Reel Quote</a>
            </div>
          `
        ],
        followUps: [
          { label: "⏱️ Delivery Time for Reels", intent: "reels_turnaround" },
          { label: "⚡ Hormozi Style Edits", intent: "style_hormozi" },
          { label: "🎬 Watch Sample Reel", intent: "reels_creative" }
        ]
      },

      // 2. YOUTUBE PRICING (Compound Specific)
      {
        id: "youtube_pricing",
        topic: "youtube",
        phrases: ["youtube price", "youtube cost", "youtube rate", "how much for youtube", "long cut price", "cost of youtube video"],
        keywords: ["price", "cost", "rate", "quote", "charge", "fee"],
        requiredTopicWords: ["youtube", "long", "long-form", "long cut", "documentary", "vlog"],
        replies: [
          `
            <p>For <strong>YouTube and long-form video editing</strong>, pricing is determined by three main elements:</p>
            <ul>
              <li><strong>Raw footage volume & final length</strong> (e.g. 8–12 mins vs 20+ mins).</li>
              <li><strong>Editing density</strong> (b-roll sourcing, custom maps, After Effects animations, and audio mix).</li>
              <li><strong>Upload frequency</strong> (single project vs weekly recurring retainer).</li>
            </ul>
            <p>Yash works closely with creators to maximize their Average View Duration (AVD) and thumbnail CTR.</p>
            <div>
              <a class="chat-cta-btn" href="mailto:yp.atil2040@gmail.com?subject=YouTube%20Long-Form%20Editing%20Quote">✉️ Get a YouTube Project Quote</a>
              <button type="button" class="chat-cta-btn" data-card-idx="2">🎥 Watch Sample YouTube Cut</button>
            </div>
          `
        ],
        followUps: [
          { label: "⏱️ YouTube Delivery Timeline", intent: "youtube_turnaround" },
          { label: "🔄 Revisions Policy", intent: "revisions_policy" },
          { label: "📬 Book a YouTube Edit", intent: "contact_booking" }
        ]
      },

      // 3. HORMOZI / CREATOR STYLE (Nuanced Creative)
      {
        id: "style_hormozi",
        topic: "reels",
        phrases: ["alex hormozi", "hormozi style", "iman gadzhi", "ali abdaal", "viral style", "kinetic captions", "dynamic subtitles", "animated captions", "bold subtitles"],
        keywords: ["hormozi", "gadzhi", "abdaal", "caption", "captions", "subtitles", "emojis", "zoom", "zooms", "retention style"],
        replies: [
          `
            <p>Yes, absolutely! Yash is deeply experienced in crafting <strong>modern high-retention creator formats</strong> (Alex Hormozi, Iman Gadzhi, Ali Abdaal styles):</p>
            <ul>
              <li><strong>Kinetic Typography:</strong> Color-highlighted words, animated pop-ins, and contextual emojis.</li>
              <li><strong>Zero Dead-Air Pacing:</strong> Strategic jump-cuts, micro-zooms, and graphic overlays.</li>
              <li><strong>Sound & Visual Cues:</strong> High-energy whooshes, risers, paper textures, and sound accents synchronized with every point.</li>
            </ul>
            <p>Check out Yash's retention cuts in the showcase:</p>
            <div>
              <button type="button" class="chat-cta-btn" data-card-idx="0">🎬 Watch Retention Edit</button>
              <button type="button" class="chat-cta-btn" data-card-idx="6">⚡ Watch Viral Hook Reel</button>
            </div>
          `
        ],
        followUps: [
          { label: "💰 Pricing for Viral Reels", intent: "reels_pricing" },
          { label: "⏱️ Delivery Speed", intent: "reels_turnaround" },
          { label: "📬 Book a Test Reel", intent: "test_sample" }
        ]
      },

      // 4. SHORT-FORM REELS (General Creative)
      {
        id: "reels_creative",
        topic: "reels",
        phrases: ["reels", "short form", "shorts", "tiktok video", "instagram reels", "vertical video", "60s video"],
        keywords: ["reel", "reels", "short", "shorts", "tiktok", "instagram", "hook", "retention", "vertical", "9:16"],
        replies: [
          `
            <p>Yash specializes in <strong>high-retention vertical edits (9:16)</strong> engineered for Instagram Reels, YouTube Shorts, and TikTok.</p>
            <p>Every cut is built around three pillars:</p>
            <ul>
              <li><strong>The 3-Second Hook:</strong> Visual punch-ins and intriguing typography to stop the scroll immediately.</li>
              <li><strong>Rhythm & Pacing:</strong> Speed ramps, motion graphics, and beat-synced match-cuts.</li>
              <li><strong>Sound Design:</strong> Layered risers, impacts, and crisp dialogue leveling.</li>
            </ul>
            <p>You can preview actual edits directly below:</p>
            <div>
              <button type="button" class="chat-cta-btn" data-card-idx="0">🎬 Watch Retention Reel</button>
              <button type="button" class="chat-cta-btn" data-card-idx="6">⚡ Watch Viral Hook Reel</button>
              <button type="button" class="chat-cta-btn" data-card-idx="7">🎵 Watch Beat-Synced Reel</button>
            </div>
          `,
          `
            <p>Short-form video is all about holding attention frame by frame. Yash edits with platform algorithms in mind—minimizing drop-off rates and keeping viewers locked in from the hook to the CTA.</p>
            <p>Whether you need educational talking-head shorts, podcast clips, or aesthetic lifestyle reels, Yash adapts the pacing to your audience.</p>
            <div>
              <button type="button" class="chat-cta-btn" data-card-idx="0">🎬 View 9:16 Reel Showcase</button>
              <a class="chat-cta-btn" href="mailto:yp.atil2040@gmail.com?subject=Reels%20Editing%20Enquiry">✉️ Work with Yash</a>
            </div>
          `
        ],
        followUps: [
          { label: "💰 Pricing for Reels", intent: "reels_pricing" },
          { label: "⏱️ Turnaround Times", intent: "reels_turnaround" },
          { label: "⚡ Hormozi Style Edits", intent: "style_hormozi" }
        ]
      },

      // 5. YOUTUBE & LONG FORM (General Creative)
      {
        id: "youtube_creative",
        topic: "youtube",
        phrases: ["youtube video", "long form", "long cut", "documentary style", "narrative video", "16:9 edit"],
        keywords: ["youtube", "long", "long-form", "long cut", "documentary", "vlog", "narrative", "story", "avd"],
        replies: [
          `
            <p>For <strong>YouTube and long-form storytelling</strong>, Yash structures edits to build narrative momentum and hold strong Average View Duration (AVD):</p>
            <ul>
              <li><strong>Intentional Story Arcs:</strong> Clear setups, escalating pacing, and satisfying resolutions.</li>
              <li><strong>Dynamic B-Roll & Visual Transitions:</strong> Cinematic inserts and motion graphics to illustrate complex ideas.</li>
              <li><strong>Audio Mixing:</strong> Clean dialogue, sound effects that underline emotion, and licensed music beds.</li>
            </ul>
            <p>Take a look at Card 03 in the portfolio for a complete narrative cut:</p>
            <div>
              <button type="button" class="chat-cta-btn" data-card-idx="2">🎥 Watch Story-Driven Long Cut</button>
            </div>
          `,
          `
            <p>Great YouTube editing is about pacing that feels effortless. Yash removes dead space, shapes natural breathing room between thoughts, and introduces visual changes every 4–6 seconds to prevent viewer fatigue.</p>
            <p>He can also assist with high-CTR thumbnails and video intros to optimize click-through and watch time together.</p>
            <div>
              <button type="button" class="chat-cta-btn" data-card-idx="2">🎥 Watch YouTube Edit</button>
              <a class="chat-cta-btn" href="mailto:yp.atil2040@gmail.com?subject=YouTube%20Project">✉️ Discuss Your YouTube Video</a>
            </div>
          `
        ],
        followUps: [
          { label: "💰 YouTube Pricing", intent: "youtube_pricing" },
          { label: "⏱️ Delivery Times", intent: "youtube_turnaround" },
          { label: "🔍 High-CTR Thumbnails", intent: "thumbnails_posters" }
        ]
      },

      // 6. PODCAST EDITING
      {
        id: "podcast_workflow",
        topic: "podcast",
        phrases: ["podcast editing", "podcast video", "podcast clips", "multicam podcast", "interview edit", "podcast highlight"],
        keywords: ["podcast", "interview", "audio", "multicam", "talk", "dialogue", "host", "guest"],
        replies: [
          `
            <p>Yash provides comprehensive <strong>podcast post-production</strong> designed for both full-length episodes and viral social distribution:</p>
            <ul>
              <li><strong>Multicam Auto/Manual Switching:</strong> Seamless cutting between host, guest, and wide shots aligned with the conversational flow.</li>
              <li><strong>Audio Polish:</strong> Dialogue clarity, noise/echo reduction, audio normalization, and breath removal.</li>
              <li><strong>Social Highlight Extraction:</strong> Turning 60-minute conversations into 3–5 high-retention 9:16 viral clips with animated waveforms and captions.</li>
            </ul>
            <div>
              <button type="button" class="chat-cta-btn" data-card-idx="1">🎙️ Watch Podcast Highlight</button>
            </div>
          `
        ],
        followUps: [
          { label: "💰 Podcast Pricing", intent: "pricing_general" },
          { label: "⏱️ Turnaround Times", intent: "turnaround" },
          { label: "📬 Book Podcast Service", intent: "contact_booking" }
        ]
      },

      // 7. FILE TRANSFER / HOW TO SEND FOOTAGE
      {
        id: "file_transfer",
        topic: "workflow",
        phrases: ["send footage", "upload footage", "transfer files", "send files", "google drive", "dropbox", "wetransfer", "frame.io", "how do i send"],
        keywords: ["footage", "raw", "files", "transfer", "send", "upload", "drive", "dropbox", "wetransfer"],
        replies: [
          `
            <p>Sending footage to Yash is simple and secure. You can use whichever platform you prefer:</p>
            <ul>
              <li><strong>Google Drive</strong> (Share folder link to <code>yp.atil2040@gmail.com</code>).</li>
              <li><strong>WeTransfer / Smash</strong> (Great for fast link transfers up to 50GB+).</li>
              <li><strong>Dropbox / OneDrive</strong>.</li>
              <li><strong>Frame.io</strong> (For collaborative timestamped reviews and asset management).</li>
            </ul>
            <p>Once raw files and your creative brief are received, Yash confirms receipt and starts editing immediately.</p>
          `
        ],
        followUps: [
          { label: "⏱️ Delivery Speed", intent: "turnaround" },
          { label: "🔄 Revisions Policy", intent: "revisions_policy" },
          { label: "📬 Start a Project", intent: "contact_booking" }
        ]
      },

      // 8. AUDIO / SFX / MUSIC COPYRIGHT
      {
        id: "audio_music",
        topic: "workflow",
        phrases: ["copyright music", "sound effects", "background music", "royalty free", "audio quality", "sfx libraries"],
        keywords: ["music", "sound", "sfx", "audio", "copyright", "foley", "licensed", "royalty"],
        replies: [
          `
            <p>Audio is 50% of the video experience. Yash pays meticulous attention to sound design:</p>
            <ul>
              <li><strong>100% Copyright-Cleared Music:</strong> Tracks sourced from licensed libraries (Artlist, Epidemic Sound) so your videos are fully safe from YouTube/Instagram copyright claims or demonetization.</li>
              <li><strong>Custom Foley & Sound Design:</strong> Layered risers, whooshes, impacts, clicks, and ambient soundscapes that match the visual cuts.</li>
              <li><strong>Broadcast-Standard Audio Mix:</strong> Balanced voice, sidechained music ducking, and noise cleanup.</li>
            </ul>
          `
        ],
        followUps: [
          { label: "🎬 Watch Beat-Synced Reel", intent: "reels_creative" },
          { label: "🛠️ Software Stack", intent: "software_tools" },
          { label: "📬 Book Yash", intent: "contact_booking" }
        ]
      },

      // 9. COLOR GRADING & LOOK
      {
        id: "color_grading",
        topic: "workflow",
        phrases: ["color grading", "color correction", "davinci color", "lut", "cinematic look", "log footage", "rec 709"],
        keywords: ["color", "grade", "grading", "lut", "luts", "cinematic", "log", "sony", "canon", "blackmagic"],
        replies: [
          `
            <p>Yash performs professional color grading in <strong>DaVinci Resolve</strong> to achieve a clean, cinematic aesthetic:</p>
            <ul>
              <li><strong>Camera Color Space Transformation:</strong> Correcting Sony S-Log, Canon C-Log, D-Log, or iPhone ProRes to Rec.709.</li>
              <li><strong>Skin Tone Accuracy:</strong> Natural, flattering skin tones balanced with artistic contrast.</li>
              <li><strong>Custom Color Moods:</strong> Stylized cyberpunk, warm sunset-gold, filmic grain, or modern commercial clean aesthetics.</li>
            </ul>
          `
        ],
        followUps: [
          { label: "🏢 View Brand Commercial", intent: "commercial_brand" },
          { label: "🛠️ Software & Tools", intent: "software_tools" },
          { label: "📬 Contact Yash", intent: "contact_booking" }
        ]
      },

      // 10. TEST EDIT / SAMPLE TRIAL
      {
        id: "test_sample",
        topic: "workflow",
        phrases: ["test edit", "sample edit", "trial edit", "can we do a test", "can i see a sample", "paid test"],
        keywords: ["test", "sample", "trial", "pilot"],
        replies: [
          `
            <p>Yes, absolutely! Yash welcomes <strong>paid test edits (or sample reels)</strong> so you can experience his communication, turnaround speed, and creative craftsmanship firsthand before committing to a larger package.</p>
            <p>You can send over raw footage for a single short-form reel or intro clip. If we are a great creative fit, the cost can be credited toward a monthly retainer!</p>
            <div>
              <a class="chat-cta-btn" href="mailto:yp.atil2040@gmail.com?subject=Paid%20Test%20Edit%20Request">📬 Request a Test Edit</a>
            </div>
          `
        ],
        followUps: [
          { label: "💰 Pricing Details", intent: "pricing_general" },
          { label: "⏱️ Turnaround Times", intent: "turnaround" },
          { label: "🎬 Watch Current Work", intent: "reels_creative" }
        ]
      },

      // 11. GENERAL PRICING & RETAINERS
      {
        id: "pricing_general",
        topic: "pricing",
        phrases: ["pricing", "how much", "what are your rates", "price list", "packages", "cost", "budget", "retainer"],
        keywords: ["price", "pricing", "cost", "rate", "rates", "budget", "quote", "charge", "package", "fee", "retainer", "monthly"],
        replies: [
          `
            <p>Yash's pricing is structured to offer maximum value and clarity:</p>
            <ul>
              <li><strong>Per-Project Rates:</strong> Tailored to the project format (Reel, YouTube episode, or Brand film) and motion complexity.</li>
              <li><strong>Monthly Retainer Packages:</strong> Ideal for creators and businesses requiring consistent weekly output (e.g. 10–30 reels/month or 4–8 YouTube videos/month) at discounted rates.</li>
            </ul>
            <p>To receive an accurate, transparent quote within 24 hours, click below to outline your project:</p>
            <div>
              <a class="chat-cta-btn" href="mailto:yp.atil2040@gmail.com?subject=Project%20Quote%20Enquiry">✉️ Request a Tailored Quote</a>
            </div>
          `,
          `
            <p>Every video has distinct requirements—some need minimal cutting while others demand heavy motion graphics, kinetic subtitles, and sound design. Yash offers competitive, transparent rates for both one-off projects and monthly retainers.</p>
            <p>Drop a brief note to <strong>yp.atil2040@gmail.com</strong> with your video idea, and Yash will prepare a clear proposal for you.</p>
            <div>
              <a class="chat-cta-btn" href="mailto:yp.atil2040@gmail.com?subject=Project%20Inquiry%20Quote">📬 Get Your Free Quote</a>
            </div>
          `
        ],
        followUps: [
          { label: "🎬 Pricing for Reels", intent: "reels_pricing" },
          { label: "🎥 Pricing for YouTube", intent: "youtube_pricing" },
          { label: "⏱️ Turnaround Times", intent: "turnaround" }
        ]
      },

      // 12. GENERAL TURNAROUND & DEADLINES
      {
        id: "turnaround",
        topic: "turnaround",
        phrases: ["turnaround", "delivery time", "how long does it take", "delivery schedule", "speed", "deadlines", "how fast"],
        keywords: ["turnaround", "time", "delivery", "deadline", "fast", "speed", "timeline", "duration", "days", "hours"],
        replies: [
          `
            <p>Yash is dedicated to dependable delivery without compromising creative quality:</p>
            <ul>
              <li><strong>Short-Form Reels:</strong> Delivered within <strong>24 to 48 hours</strong>.</li>
              <li><strong>YouTube Long-Form:</strong> Typically <strong>3 to 5 business days</strong> (depending on duration and graphics complexity).</li>
              <li><strong>Podcasts:</strong> Typically <strong>48 to 72 hours</strong>.</li>
              <li><strong>Expedited / Rush Projects:</strong> Same-day or weekend turnaround can be arranged upon request.</li>
            </ul>
            <p>Do you have an upcoming project deadline?</p>
          `,
          `
            <p>Speed matters in content creation. Standard turnaround times are <strong>24–48 hours for short-form reels</strong> and <strong>3–5 days for full-length YouTube cuts</strong>.</p>
            <p>Yash maintains regular communication throughout the process so you always know the exact status of your project.</p>
          `
        ],
        followUps: [
          { label: "🔄 Revisions Policy", intent: "revisions_policy" },
          { label: "💰 Pricing & Rates", intent: "pricing_general" },
          { label: "📬 Book a Project", intent: "contact_booking" }
        ]
      },

      // 13. REVISIONS POLICY
      {
        id: "revisions_policy",
        topic: "workflow",
        phrases: ["revisions", "changes", "tweak", "feedback", "what if i don't like it", "revision policy", "how many revisions"],
        keywords: ["revision", "revisions", "changes", "feedback", "tweak", "policy", "round", "rounds"],
        replies: [
          `
            <p>Your creative satisfaction is paramount. Yash includes <strong>2 rounds of collaborative revisions</strong> with every project at no extra charge:</p>
            <ul>
              <li><strong>Round 1 (Structural & Pacing):</strong> Reviewing the cut, sequence order, b-roll choices, and storytelling flow.</li>
              <li><strong>Round 2 (Finishing & Polish):</strong> Fine-tuning sound mix, color grade, caption styling, and subtle timing tweaks.</li>
            </ul>
            <p>Review links are shared with timestamped comments for smooth, seamless iteration.</p>
          `
        ],
        followUps: [
          { label: "⏱️ Delivery Timeline", intent: "turnaround" },
          { label: "💰 Pricing & Rates", intent: "pricing_general" },
          { label: "📬 Start a Conversation", intent: "contact_booking" }
        ]
      },

      // 14. MOTION GRAPHICS & TITLES
      {
        id: "motion_titles",
        topic: "motion",
        phrases: ["motion graphics", "title design", "kinetic typography", "after effects", "lower thirds", "logo animation"],
        keywords: ["motion", "title", "graphics", "animation", "vfx", "transition", "transitions"],
        replies: [
          `
            <p>Yash designs custom <strong>motion graphics and title systems</strong> in Adobe After Effects to elevate brand identities:</p>
            <ul>
              <li>Kinetic typography and dynamic text reveals.</li>
              <li>Branded lower-thirds, callouts, and icon animations.</li>
              <li>Custom logo stingers, intro/outro animations, and match-cut transitions.</li>
            </ul>
            <p>Take a look at Card 05 in the portfolio to see motion graphics in action:</p>
            <div>
              <button type="button" class="chat-cta-btn" data-card-idx="4">✨ Watch Motion & Title Cut</button>
            </div>
          `
        ],
        followUps: [
          { label: "🔍 View Posters & Thumbnails", intent: "thumbnails_posters" },
          { label: "💰 Motion Rates", intent: "pricing_general" },
          { label: "📬 Inquire About Motion", intent: "contact_booking" }
        ]
      },

      // 15. THUMBNAILS & POSTERS
      {
        id: "thumbnails_posters",
        topic: "design",
        phrases: ["thumbnails", "poster design", "high ctr", "youtube thumbnail", "graphic design", "poster"],
        keywords: ["thumbnail", "thumbnails", "poster", "posters", "ctr", "graphic", "cover"],
        replies: [
          `
            <p>A video’s packaging is just as critical as the edit itself. Yash creates <strong>high-CTR thumbnails and posters</strong> designed to command attention in crowded content feeds:</p>
            <ul>
              <li>High-contrast visual hierarchy and focal depth.</li>
              <li>Expressive facial cutouts, clean color separation, and minimal bold text.</li>
              <li>Designed in Photoshop & Illustrator specifically for mobile and desktop screens.</li>
            </ul>
            <div>
              <button type="button" class="chat-cta-btn" data-card-idx="3">🔍 View High-CTR Artwork</button>
            </div>
          `
        ],
        followUps: [
          { label: "🎥 YouTube Long Cuts", intent: "youtube_creative" },
          { label: "💰 Pricing Details", intent: "pricing_general" },
          { label: "📬 Book Design Service", intent: "contact_booking" }
        ]
      },

      // 16. COMMERCIAL & BRAND FILMS
      {
        id: "commercial_brand",
        topic: "commercial",
        phrases: ["commercial film", "brand edit", "startup video", "business promo", "brand commercial", "corporate video"],
        keywords: ["commercial", "startup", "brand", "business", "promo", "ad", "corporate"],
        replies: [
          `
            <p>For brands and modern startups, Yash edits <strong>concise, high-polish commercial films</strong> that balance clarity of message with visual sophistication.</p>
            <p>Check out Card 06 in the portfolio to see his commercial work:</p>
            <div>
              <button type="button" class="chat-cta-btn" data-card-idx="5">🏢 Watch Startup Commercial</button>
            </div>
          `
        ],
        followUps: [
          { label: "⏱️ Commercial Turnaround", intent: "turnaround" },
          { label: "💰 Commercial Rates", intent: "pricing_general" },
          { label: "📬 Discuss Brand Project", intent: "contact_booking" }
        ]
      },

      // 17. SOFTWARE & CREATIVE TOOLS
      {
        id: "software_tools",
        topic: "software",
        phrases: ["software", "what tools", "premiere pro", "davinci resolve", "after effects", "specs", "hardware"],
        keywords: ["software", "tool", "tools", "app", "premiere", "after effects", "davinci", "photoshop", "hardware"],
        replies: [
          `
            <p>Yash’s industry-standard post-production pipeline includes:</p>
            <ul>
              <li><strong>Adobe Premiere Pro:</strong> Primary editorial, pacing & multicam assembly.</li>
              <li><strong>Adobe After Effects:</strong> Kinetic typography, tracking & motion VFX.</li>
              <li><strong>DaVinci Resolve:</strong> Advanced color grading & cinematic finishing.</li>
              <li><strong>Adobe Photoshop & Illustrator:</strong> High-CTR thumbnail and poster graphics.</li>
              <li><strong>Curated Sound Libraries:</strong> Artlist, Epidemic Sound, and bespoke Foley packs.</li>
            </ul>
          `
        ],
        followUps: [
          { label: "🔄 Revisions Process", intent: "revisions_policy" },
          { label: "🎬 View Selected Work", intent: "reels_creative" },
          { label: "📬 Contact Yash", intent: "contact_booking" }
        ]
      },

      // 18. PROCESS & WORKFLOW
      {
        id: "process_workflow",
        topic: "workflow",
        phrases: ["process", "workflow", "how it works", "steps", "editorial process"],
        keywords: ["process", "workflow", "steps", "how it works", "stages"],
        replies: [
          `
            <p>Yash’s collaborative process ensures your video lands with intention:</p>
            <ul>
              <li><strong>01 / Understand:</strong> Aligning on the core story, target platform, audience, and key retention goal.</li>
              <li><strong>02 / Shape:</strong> Ingesting footage, building the structural rhythm, pacing the narrative, and refining cuts.</li>
              <li><strong>03 / Finish:</strong> Polishing every frame with color grading, custom sound effects, kinetic subtitles, and platform-ready master exports.</li>
            </ul>
          `
        ],
        followUps: [
          { label: "⏱️ Delivery Speed", intent: "turnaround" },
          { label: "🔄 Revisions Included", intent: "revisions_policy" },
          { label: "📬 Start a Project", intent: "contact_booking" }
        ]
      },

      // 19. ABOUT YASH / BACKGROUND
      {
        id: "about_yash",
        topic: "about",
        phrases: ["who is yash", "about yash", "who is he", "yash patil", "tell me about yash", "experience"],
        keywords: ["who is yash", "about yash", "experience", "bio", "background", "storyteller", "editor"],
        replies: [
          `
            <p><strong>Yash Patil</strong> is a professional video editor and visual storyteller. He turns raw footage into purposeful, high-retention content with intentional pacing, kinetic typography, and immersive sound design.</p>
            <p>Whether you are a solo creator, a podcaster, or a modern brand, Yash crafts visual rhythm that keeps viewers hooked.</p>
            <div>
              <a class="chat-cta-btn" href="#about">📖 View About Yash</a>
              <button type="button" class="chat-cta-btn" id="chat-open-showreel-btn">🎬 Play Showreel</button>
            </div>
          `
        ],
        followUps: [
          { label: "🎬 Explore Works", intent: "reels_creative" },
          { label: "💰 Rates & Retainers", intent: "pricing_general" },
          { label: "📬 Book Yash", intent: "contact_booking" }
        ]
      },

      // 20. CONTACT & BOOKING
      {
        id: "contact_booking",
        topic: "contact",
        phrases: ["contact", "hire", "book", "email", "get in touch", "talk to yash", "work together", "collaborate"],
        keywords: ["contact", "hire", "book", "email", "reach", "collaborate", "mail", "inquiry"],
        replies: [
          `
            <p>Yash is currently accepting select projects and long-term creator partnerships. You can reach him directly at:</p>
            <p>📧 <strong>yp.atil2040@gmail.com</strong></p>
            <p>He typically responds within 24 hours. Click below to start an email draft right now:</p>
            <div>
              <a class="chat-cta-btn" href="mailto:yp.atil2040@gmail.com?subject=Portfolio%20Project%20Booking">📬 Send Project Details to Yash</a>
            </div>
          `
        ],
        followUps: [
          { label: "💰 Pricing & Retainers", intent: "pricing_general" },
          { label: "⏱️ Delivery Times", intent: "turnaround" },
          { label: "🎬 Watch Showreel", intent: "about_yash" }
        ]
      },

      // 21. GREETINGS
      {
        id: "greetings",
        topic: "general",
        phrases: ["hello", "hi", "hey", "good morning", "good evening", "good afternoon", "greetings", "whats up", "howdy"],
        keywords: ["hello", "hi", "hey", "morning", "evening", "afternoon", "greetings"],
        replies: [
          `
            <p>Hello! Welcome to Yash Patil’s editing studio. It is a pleasure to connect with you.</p>
            <p>How can I assist you today? Feel free to ask about short-form reels, long-form YouTube cuts, pricing, turnaround times, or booking a project.</p>
          `,
          `
            <p>Hi there! Great to have you here. I am Yash’s virtual assistant. What kind of video project are you looking to create?</p>
          `
        ],
        followUps: [
          { label: "🎬 Short-Form Reels", intent: "reels_creative" },
          { label: "🎥 YouTube & Long Cuts", intent: "youtube_creative" },
          { label: "💰 Pricing & Retainers", intent: "pricing_general" },
          { label: "⏱️ Delivery Times", intent: "turnaround" }
        ]
      },

      // 22. THANK YOU
      {
        id: "thanks",
        topic: "general",
        phrases: ["thank you", "thanks", "appreciate it", "helpful", "awesome", "great", "cool", "perfect"],
        keywords: ["thank", "thanks", "appreciate", "helpful", "awesome", "great", "cool", "perfect"],
        replies: [
          `
            <p>You are most welcome! It is an absolute pleasure to help. If you'd like to bring a video idea to life, Yash is just an email away at <strong>yp.atil2040@gmail.com</strong>.</p>
          `,
          `
            <p>Glad I could help! Feel free to ask anything else, or click below to connect with Yash directly for your upcoming video project.</p>
            <div>
              <a class="chat-cta-btn" href="mailto:yp.atil2040@gmail.com?subject=Project%20Enquiry">📬 Reach Out to Yash</a>
            </div>
          `
        ],
        followUps: [
          { label: "🎬 View Selected Work", intent: "reels_creative" },
          { label: "📬 Book a Project", intent: "contact_booking" }
        ]
      }
    ];

    // Helper: Update dynamic follow-up chips
    const renderFollowUpChips = (chips) => {
      if (!quickChipsWrap) return;
      quickChipsWrap.replaceChildren();

      chips.forEach((chipData) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "chat-chip";
        btn.dataset.intent = chipData.intent;
        btn.textContent = chipData.label;
        btn.addEventListener("click", () => triggerIntent(chipData.intent, chipData.label));
        quickChipsWrap.appendChild(btn);
      });

      // Add a subtle reset button to return to all topics
      const resetChip = document.createElement("button");
      resetChip.type = "button";
      resetChip.className = "chat-chip";
      resetChip.textContent = "↺ All Topics";
      resetChip.style.opacity = "0.75";
      resetChip.addEventListener("click", () => renderFollowUpChips(defaultChips));
      quickChipsWrap.appendChild(resetChip);
    };

    // Advanced Weighted Scorer & Context Matcher
    const findBestMatch = (rawText) => {
      const text = rawText.toLowerCase().trim();

      // Check for follow-up contextual cues
      if (memory.lastTopic) {
        if (/price|cost|rate|quote|charge|how much/i.test(text)) {
          if (memory.lastTopic === "reels") return knowledgeBase.find((e) => e.id === "reels_pricing");
          if (memory.lastTopic === "youtube") return knowledgeBase.find((e) => e.id === "youtube_pricing");
        }
        if (/turnaround|delivery|time|how long|fast|deadline/i.test(text)) {
          if (memory.lastTopic === "reels") return knowledgeBase.find((e) => e.id === "turnaround");
          if (memory.lastTopic === "youtube") return knowledgeBase.find((e) => e.id === "turnaround");
        }
      }

      let bestScore = 0;
      let bestEntry = null;

      for (const entry of knowledgeBase) {
        let score = 0;

        // Check exact phrases (+14)
        if (entry.phrases) {
          for (const phrase of entry.phrases) {
            if (text.includes(phrase)) {
              score += 14;
            }
          }
        }

        // Check required topic words for compound intents
        if (entry.requiredTopicWords) {
          const hasTopicWord = entry.requiredTopicWords.some((tw) => text.includes(tw));
          if (!hasTopicWord) {
            continue; // Skip compound intent if topic word isn't present
          }
          score += 6;
        }

        // Check individual keywords (+3)
        if (entry.keywords) {
          for (const kw of entry.keywords) {
            const regex = new RegExp(`\\b${kw}\\b`, "i");
            if (regex.test(text)) {
              score += 3;
            } else if (text.includes(kw)) {
              score += 1.5;
            }
          }
        }

        // Context alignment boost
        if (memory.lastTopic && entry.topic === memory.lastTopic) {
          score += 2;
        }

        if (score > bestScore) {
          bestScore = score;
          bestEntry = entry;
        }
      }

      return bestScore >= 3 ? bestEntry : null;
    };

    const toggleChat = (forceState) => {
      isChatOpen = typeof forceState === "boolean" ? forceState : !isChatOpen;
      chatWidget.classList.toggle("is-open", isChatOpen);
      chatPanel.classList.toggle("is-open", isChatOpen);
      chatToggle.setAttribute("aria-expanded", String(isChatOpen));
      chatPanel.setAttribute("aria-hidden", String(!isChatOpen));

      if (isChatOpen) {
        if (chatMessages.children.length === 0) {
          sendWelcomeMessage();
        }
        setTimeout(() => chatInput?.focus(), 150);
      }
    };

    const appendMessage = (sender, htmlContent) => {
      const msgRow = document.createElement("div");
      msgRow.className = `chat-msg ${sender}`;

      if (sender === "bot") {
        const avatar = document.createElement("div");
        avatar.className = "chat-msg-avatar";
        const img = document.createElement("img");
        img.src = avatarUrl;
        img.alt = "Studio AI Assistant";
        avatar.appendChild(img);
        msgRow.appendChild(avatar);
      }

      const bubble = document.createElement("div");
      bubble.className = "chat-bubble";
      bubble.innerHTML = htmlContent;
      msgRow.appendChild(bubble);

      chatMessages.appendChild(msgRow);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      // Attach dynamic card play handlers
      bubble.querySelectorAll("[data-card-idx]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.dataset.cardIdx, 10);
          const targetCard = cards[idx];
          if (targetCard) {
            const openBtn = targetCard.querySelector(".project-open");
            if (openBtn) {
              openBtn.click();
            }
          }
        });
      });

      const showreelBtn = bubble.querySelector("#chat-open-showreel-btn");
      if (showreelBtn) {
        showreelBtn.addEventListener("click", () => openShowreelModal());
      }
    };

    const showTypingIndicator = () => {
      isBotTyping = true;
      const indicator = document.createElement("div");
      indicator.className = "chat-msg bot chat-typing-row";
      indicator.id = "chat-typing-indicator";

      const avatar = document.createElement("div");
      avatar.className = "chat-msg-avatar";
      const img = document.createElement("img");
      img.src = avatarUrl;
      img.alt = "Studio AI Assistant";
      avatar.appendChild(img);

      const bubble = document.createElement("div");
      bubble.className = "chat-bubble";
      bubble.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';

      indicator.append(avatar, bubble);
      chatMessages.appendChild(indicator);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const removeTypingIndicator = () => {
      document.getElementById("chat-typing-indicator")?.remove();
      isBotTyping = false;
    };

    const sendWelcomeMessage = () => {
      showTypingIndicator();
      renderFollowUpChips(defaultChips);
      setTimeout(() => {
        removeTypingIndicator();
        appendMessage(
          "bot",
          `
            <p><strong>Hello! Welcome to Yash Patil’s studio.</strong></p>
            <p>I am your Studio AI Assistant. I can help you explore Yash's video editing portfolio, discuss turnaround times and pricing, or help you book a project.</p>
            <p>How may I assist you today?</p>
          `
        );
      }, 500);
    };

    const triggerIntent = (intentId, userPrompt) => {
      if (isBotTyping) return;
      if (userPrompt) appendMessage("user", userPrompt);

      const entry = knowledgeBase.find((item) => item.id === intentId);
      if (!entry) return;

      memory.lastTopic = entry.topic || memory.lastTopic;
      memory.turnCount++;

      // Rotate through replies to prevent repetitive identical paragraphs
      const replyList = entry.replies || [entry.reply];
      const curIdx = memory.replyIndices[entry.id] || 0;
      const selectedReply = replyList[curIdx % replyList.length];
      memory.replyIndices[entry.id] = curIdx + 1;

      showTypingIndicator();
      setTimeout(() => {
        removeTypingIndicator();
        appendMessage("bot", selectedReply);
        if (entry.followUps && entry.followUps.length > 0) {
          renderFollowUpChips(entry.followUps);
        }
      }, 450);
    };

    const processQuery = (rawText) => {
      const text = rawText.trim();
      if (!text || isBotTyping) return;

      appendMessage("user", rawText);
      chatInput.value = "";
      showTypingIndicator();

      const matchedEntry = findBestMatch(text);

      let replyContent = "";
      let followUpList = defaultChips;

      if (matchedEntry) {
        memory.lastTopic = matchedEntry.topic || memory.lastTopic;
        memory.turnCount++;

        // Select response variation
        const replyList = matchedEntry.replies || [matchedEntry.reply];
        const curIdx = memory.replyIndices[matchedEntry.id] || 0;
        replyContent = replyList[curIdx % replyList.length];
        memory.replyIndices[matchedEntry.id] = curIdx + 1;

        if (matchedEntry.followUps && matchedEntry.followUps.length > 0) {
          followUpList = matchedEntry.followUps;
        }
      } else {
        replyContent = `
          <p>Thank you for your message! While I don't have an automated answer for that exact detail, Yash would be delighted to discuss it with you personally.</p>
          <p>You can send him a direct email at <strong>yp.atil2040@gmail.com</strong> or choose one of the topics below:</p>
          <div>
            <a class="chat-cta-btn" href="mailto:yp.atil2040@gmail.com?subject=Creative%20Editing%20Enquiry">✉️ Email Yash Directly</a>
          </div>
        `;
        followUpList = defaultChips;
      }

      // Human-like thinking latency based on query length
      const delay = Math.min(750, Math.max(380, text.length * 12));
      setTimeout(() => {
        removeTypingIndicator();
        appendMessage("bot", replyContent);
        renderFollowUpChips(followUpList);
      }, delay);
    };

    // Event Listeners
    chatToggle.addEventListener("click", () => toggleChat());
    chatCloseBtn?.addEventListener("click", () => toggleChat(false));

    chatResetBtn?.addEventListener("click", () => {
      chatMessages.replaceChildren();
      memory.lastTopic = null;
      memory.turnCount = 0;
      memory.replyIndices = {};
      sendWelcomeMessage();
    });

    chatForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      processQuery(chatInput.value);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isChatOpen) {
        toggleChat(false);
        chatToggle.focus();
      }
    });

    // Initial Chip Binding
    renderFollowUpChips(defaultChips);
  }

  // Dynamic Year in footer
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
