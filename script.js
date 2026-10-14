(() => {
  "use strict";

  // Prevent duplicate listeners if the script is accidentally included twice.
  if (window.__portfolioMotionInitialized) return;
  window.__portfolioMotionInitialized = true;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const motionStyles = document.createElement("link");
  motionStyles.rel = "stylesheet";
  motionStyles.href = "motion.css";
  motionStyles.dataset.portfolioMotion = "true";
  document.head.appendChild(motionStyles);

  const projectDialog = document.getElementById("project-dialog");
  const reelDialog = document.getElementById("reel-dialog");
  const menuToggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav-links");
  const cards = [...document.querySelectorAll(".project-card")];
  const filterGroup = document.querySelector(".filters");
  let lastDialogTrigger = null;

  // The starter had five filters for six tiles, with motion and brand combined.
  // Split these categories so every portfolio type can be filtered individually.
  const motionFilter = filterGroup?.querySelector('[data-filter="motion"]');
  if (motionFilter) {
    motionFilter.textContent = "Motion Graphics";
    const brandFilter = document.createElement("button");
    brandFilter.type = "button";
    brandFilter.className = "filter";
    brandFilter.dataset.filter = "brand";
    brandFilter.textContent = "Commercials & Brand Videos";
    motionFilter.insertAdjacentElement("afterend", brandFilter);
  }
  const brandCard = cards.find((card) => (card.dataset.title || "").toLowerCase().includes("brand & social"));
  if (brandCard) {
    brandCard.dataset.category = "brand";
    brandCard.dataset.type = "COMMERCIALS & BRAND VIDEOS";
    const typeLabel = brandCard.querySelector(".project-type");
    if (typeLabel) typeLabel.textContent = "COMMERCIALS & BRAND VIDEOS";
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
      card.classList.toggle("hidden", !visible);
      card.setAttribute("aria-hidden", String(!visible));
      if (visible) card.removeAttribute("inert");
      else card.setAttribute("inert", "");
    });
    updateFilterCounts();
  };

  filters.forEach((button) => button.addEventListener("click", () => applyFilter(button.dataset.filter)));
  applyFilter(document.querySelector(".filter.active")?.dataset.filter || "all");

  // Native dialogs handle Escape and contain focus; return focus to their trigger.
  const openDialog = (dialog, trigger) => {
    if (!dialog || typeof dialog.showModal !== "function") return;
    lastDialogTrigger = trigger;
    dialog.showModal();
    dialog.querySelector(".dialog-close")?.focus();
  };

  document.querySelectorAll(".project-open").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".project-card");
      document.getElementById("dialog-title").textContent = card.dataset.title || "Project";
      document.getElementById("dialog-type").textContent = card.dataset.type || "PROJECT";
      document.getElementById("dialog-desc").textContent = card.dataset.desc || "";
      const media = projectDialog?.querySelector(".dialog-placeholder");
      if (media) {
        const videoUrl = card.dataset.video;
        const posterUrl = card.dataset.poster;
        media.replaceChildren();
        if (videoUrl) {
          const video = document.createElement("video");
          video.controls = true;
          video.playsInline = true;
          video.preload = "metadata";
          if (posterUrl) video.poster = posterUrl;
          const source = document.createElement("source");
          source.src = videoUrl;
          source.type = /\.webm(?:$|\?)/i.test(videoUrl) ? "video/webm" : "video/mp4";
          video.appendChild(source);
          video.addEventListener("error", () => {
            const fallback = document.createElement("p");
            fallback.className = "media-fallback";
            fallback.textContent = "This preview could not be loaded. Please check the video URL.";
            media.replaceChildren(fallback);
          }, { once: true });
          media.appendChild(video);
        } else if (posterUrl) {
          const image = document.createElement("img");
          image.src = posterUrl;
          image.alt = (card.dataset.title || "Project") + " poster";
          image.loading = "lazy";
          media.appendChild(image);
        } else {
          const label = document.createElement("span");
          label.textContent = "PROJECT MEDIA PLACEHOLDER";
          const hint = document.createElement("small");
          hint.textContent = "Add data-poster or data-video to this project card when real media is available.";
          media.append(label, hint);
        }
      }
      openDialog(projectDialog, button);
    });
  });

  document.querySelector("[data-reel]")?.addEventListener("click", (event) => {
    const reelCard = document.querySelector(".showreel-card");
    const reelUrl = reelCard?.dataset.video;
    const poster = reelCard?.dataset.poster;
    const media = reelDialog?.querySelector(".dialog-placeholder");
    if (media) {
      media.replaceChildren();
      if (reelUrl) {
        const video = document.createElement("video");
        video.controls = true;
        video.playsInline = true;
        video.preload = "metadata";
        if (poster) video.poster = poster;
        const source = document.createElement("source");
        source.src = reelUrl;
        source.type = /\.webm(?:$|\?)/i.test(reelUrl) ? "video/webm" : "video/mp4";
        video.appendChild(source);
        video.addEventListener("error", () => {
          media.textContent = "The showreel could not be loaded. Check the video URL.";
        }, { once: true });
        media.appendChild(video);
      } else {
        const label = document.createElement("span");
        label.textContent = "SHOWREEL VIDEO PLACEHOLDER";
        const hint = document.createElement("small");
        hint.textContent = "Add data-video and optional data-poster to .showreel-card in index.html.";
        media.append(label, hint);
      }
    }
    openDialog(reelDialog, event.currentTarget);
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
      if (lastDialogTrigger?.isConnected) lastDialogTrigger.focus();
      lastDialogTrigger = null;
    });
  });

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

  const revealTargets = document.querySelectorAll(".hero-copy, .hero-stage, .section-heading, .project-card, .service-row, .process-card, .about-art, .about-copy, .contact > *");
  if (!reducedMotion.matches && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -35px 0px" });
    revealTargets.forEach((element, index) => {
      element.classList.add("will-reveal");
      element.style.setProperty("--reveal-delay", (Math.min(index % 5, 4) * 70) + "ms");
      revealObserver.observe(element);
    });
    window.addEventListener("pagehide", () => revealObserver.disconnect(), { once: true });
  } else {
    revealTargets.forEach((element) => element.classList.add("is-visible"));
  }

  // Scroll-linked parallax is kept subtle and batched to one animation frame.
  let scrollFrame = 0;
  const updateScrollMotion = () => {
    scrollFrame = 0;
    if (reducedMotion.matches) {
      document.documentElement.style.setProperty("--scroll-progress", "0%");
      document.querySelectorAll(".stage-art, .about-monogram").forEach((el) => el.style.removeProperty("--scroll-shift"));
      return;
    }
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    document.documentElement.style.setProperty("--scroll-progress", progress + "%");
    document.querySelectorAll(".stage-art, .about-monogram").forEach((element) => {
      const rect = element.getBoundingClientRect();
      const distance = (rect.top + rect.height / 2 - window.innerHeight * 0.5) / Math.max(window.innerHeight, 1);
      const offset = Math.max(-16, Math.min(16, distance * -14));
      element.style.setProperty("--scroll-shift", offset.toFixed(2) + "px");
    });
  };
  const requestScrollMotion = () => {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScrollMotion);
  };
  window.addEventListener("scroll", requestScrollMotion, { passive: true });
  window.addEventListener("resize", requestScrollMotion, { passive: true });
  reducedMotion.addEventListener?.("change", requestScrollMotion);
  requestScrollMotion();

  if (!reducedMotion.matches && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    cards.forEach((card) => {
      const visual = card.querySelector(".project-visual");
      card.addEventListener("pointermove", (event) => {
        if (!visual) return;
        const rect = visual.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        card.style.setProperty("--tilt-x", ((0.5 - y) * 1.5).toFixed(2) + "deg");
        card.style.setProperty("--tilt-y", ((x - 0.5) * 1.5).toFixed(2) + "deg");
      });
      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--tilt-x", "0deg");
        card.style.setProperty("--tilt-y", "0deg");
      });
    });
  }

  if ("IntersectionObserver" in window) {
    const navAnchors = [...(nav?.querySelectorAll('a[href^="#"]') || [])];
    const activeObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navAnchors.forEach((anchor) => {
          if (anchor.hash === "#" + entry.target.id) anchor.setAttribute("aria-current", "location");
          else anchor.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-28% 0px -58% 0px" });
    sections.forEach((section) => activeObserver.observe(section));
    window.addEventListener("pagehide", () => activeObserver.disconnect(), { once: true });
  }
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
