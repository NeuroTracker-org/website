import { useRef, useState, useEffect, useMemo } from 'react';
import styles from './CustomCarousel.module.css';

function CustomCarousel({ children, visible = 6, gap = 12, innerButtons = false }) {
  const viewportRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  // Pour le drag & drop
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);

  const updateButtons = () => {
    const el = viewportRef.current;
    if (!el) return;
    const atStart = el.scrollLeft <= 1;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
    setCanPrev(!atStart);
    setCanNext(!atEnd);
  };

  useEffect(() => {
    updateButtons();
    const el = viewportRef.current;
    if (!el) return;

    const onResize = () => updateButtons();
    const onScroll = () => updateButtons();

    window.addEventListener('resize', onResize);
    el.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', onResize);
      el.removeEventListener('scroll', onScroll);
    };
  }, []);

  const onPrev = () => {
    const el = viewportRef.current;
    if (!el) return;
    const step = (el.clientWidth / visible) * visible;
    el.scrollBy({ left: -step, behavior: 'smooth' });
  };

  const onNext = () => {
    const el = viewportRef.current;
    if (!el) return;
    const step = (el.clientWidth / visible) * visible;
    el.scrollBy({ left: step, behavior: 'smooth' });
  };

  // Drag handlers
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onMouseDown = (e) => {
      isDragging.current = true;
      el.classList.add(styles.dragging);
      startX.current = e.pageX - el.offsetLeft;
      scrollStart.current = el.scrollLeft;
    };

    const onMouseMove = (e) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX.current) * 1.5; // multiplier la sensibilité
      el.scrollLeft = scrollStart.current - walk;
    };

    const onMouseUp = () => {
      isDragging.current = false;
      el.classList.remove(styles.dragging);
    };

    const onTouchStart = (e) => {
      isDragging.current = true;
      startX.current = e.touches[0].pageX - el.offsetLeft;
      scrollStart.current = el.scrollLeft;
    };

    const onTouchMove = (e) => {
      if (!isDragging.current) return;
      const x = e.touches[0].pageX - el.offsetLeft;
      const walk = (x - startX.current) * 1.5;
      el.scrollLeft = scrollStart.current - walk;
    };

    const onTouchEnd = () => {
      isDragging.current = false;
    };

    // Mouse
    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseleave', onMouseUp);
    el.addEventListener('mouseup', onMouseUp);
    // Touch
    el.addEventListener('touchstart', onTouchStart);
    el.addEventListener('touchmove', onTouchMove);
    el.addEventListener('touchend', onTouchEnd);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseleave', onMouseUp);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [visible]);

  const trackStyle = useMemo(() => ({ gap: `${gap}px` }), [gap]);

  return (
    <div className={styles.carousel}>
      <button
        aria-label="Précédent"
        onClick={onPrev}
        disabled={!canPrev}
        className={`${styles.navBtn} ${innerButtons ? styles.innerButtons : undefined} ${!canPrev ? styles.navBtnDisabled : ''}`}
      >
        <i className="fa-solid fa-chevron-left" />
      </button>

      <div className={styles.viewport} ref={viewportRef}>
        <div className={styles.track} style={trackStyle}>
          {Array.isArray(children)
            ? children.map((child, index) => (
                <div className={styles.cell} key={index} style={{ flex: `0 0 calc(100% / ${visible} - ${gap}px + 1px)` }}>
                  {child}
                </div>
              ))
            : (
                <div className={styles.cell} style={{ flex: `0 0 calc(100% / ${visible} - ${gap}px + 1px)` }}>
                  {children}
                </div>
              )}
        </div>
      </div>

      <button
        aria-label="Suivant"
        onClick={onNext}
        disabled={!canNext}
        className={`${styles.navBtn} ${innerButtons ? styles.innerButtons : undefined} ${!canNext ? styles.navBtnDisabled : ''}`}
      >
        <i className="fa-solid fa-chevron-right" />
      </button>
    </div>
  );
}

export default CustomCarousel;
