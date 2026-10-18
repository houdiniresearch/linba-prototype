"use client";

import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
  type CollisionDetection,
  type DragEndEvent,
  type Modifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Course, Slide } from "@/lib/types";
import { moveActivityInOrder } from "@/lib/slide-order";
import { useLocale } from "./locale-provider";
import { SlideView, slideTitle } from "./slides";
import { Icon, Logo } from "./ui";

const verticalOnly: Modifier = ({ transform }) => ({ ...transform, x: 0 });
type Props = {
  course: Course;
  editable: boolean;
  disabled: boolean;
  onAdd: (event: MouseEvent<HTMLButtonElement>) => void;
  onSelect: (id: string) => void;
  onReorder: (ids: string[]) => Promise<void>;
};

export function SlideRail({
  course,
  editable,
  disabled,
  onAdd,
  onSelect,
  onReorder,
}: Props) {
  const { t } = useLocale();
  const contextId = useId();
  const rail = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [dragHeight, setDragHeight] = useState<number>();
  const [optimisticIds, setOptimisticIds] = useState<string[] | null>(null);
  const [pending, setPending] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 220, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  useEffect(() => {
    setMounted(true);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const slides =
    optimisticIds &&
    optimisticIds.length === course.slides.length &&
    optimisticIds.every((id) => course.slides.some((slide) => slide.id === id))
      ? optimisticIds.map((id) =>
          course.slides.find((slide) => slide.id === id)!,
        )
      : course.slides;
  const ids = slides.map((slide) => slide.id);
  const projected =
    activeId && overId
      ? moveActivityInOrder(slides, activeId, overId) || ids
      : ids;
  const activeSlide = slides.find((slide) => slide.id === activeId);
  const locked = disabled || pending;
  const collisionDetection: CollisionDetection = (args) => {
    const bounds = rail.current?.getBoundingClientRect();
    const pointer = args.pointerCoordinates;
    if (
      bounds &&
      pointer &&
      (pointer.x < bounds.left - 12 ||
        pointer.x > bounds.right + 24 ||
        pointer.y < bounds.top ||
        pointer.y > bounds.bottom)
    )
      return [];
    return closestCenter(args);
  };
  async function commit(activityId: string, targetId: string) {
    const order = moveActivityInOrder(slides, activityId, targetId);
    if (
      !editable ||
      locked ||
      !order ||
      order.every((id, index) => id === ids[index])
    )
      return;
    const focused =
      document.activeElement instanceof HTMLElement &&
      rail.current?.contains(document.activeElement)
        ? (document.activeElement as HTMLElement)
        : null;
    setOptimisticIds(order);
    setPending(true);
    setAnnouncement("");
    try {
      await onReorder(order);
      setAnnouncement(t("Slide order saved."));
    } catch {
      setAnnouncement(
        t("The move could not be saved. The previous order was restored."),
      );
    } finally {
      setOptimisticIds(null);
      setPending(false);
      requestAnimationFrame(() => {
        if (
          !focused ||
          (document.activeElement !== document.body &&
            document.activeElement !== focused)
        )
          return;
        if (focused.isConnected && !focused.matches(":disabled"))
          focused.focus({ preventScroll: true });
        else {
          const item = Array.from(
            rail.current?.querySelectorAll<HTMLElement>("[data-slide-id]") ||
              [],
          ).find((node) => node.dataset.slideId === activityId);
          item
            ?.querySelector<HTMLButtonElement>(".thumbnail")
            ?.focus({ preventScroll: true });
        }
      });
    }
  }
  function finishDrag({ active, over }: DragEndEvent) {
    setActiveId(null);
    setOverId(null);
    if (over) void commit(String(active.id), String(over.id));
  }
  return (
    <aside
      className={`slide-rail ${activeId ? "is-dragging-slide" : ""}`}
      ref={rail}
    >
      <div className="rail-heading">
        {editable ? (
          <button
            className="text-button"
            disabled={locked || !!activeId}
            onClick={onAdd}
          >
            <Icon name="plus" />
            {t("Add activity")}
          </button>
        ) : (
          <strong>{t("Presentation flow")}</strong>
        )}
        <span>
          {slides.length} {t("slides")}
        </span>
      </div>
      <DndContext
        id={contextId}
        sensors={sensors}
        collisionDetection={collisionDetection}
        modifiers={[verticalOnly]}
        autoScroll={editable && !locked}
        accessibility={{
          screenReaderInstructions: {
            draggable: t(
              "To move an activity, press Space or Enter, use the arrow keys, then press Space or Enter to place it. Escape cancels.",
            ),
          },
          announcements: {
            onDragStart: ({ active }) =>
              t("Activity picked up at position {position}.", {
                position: ids.indexOf(String(active.id)) + 1,
              }),
            onDragOver: ({ over }) =>
              over
                ? t("Place at position {position} of {count}.", {
                    position: ids.indexOf(String(over.id)) + 1,
                    count: ids.length,
                  })
                : t("Outside the slide list. Release to cancel."),
            onDragEnd: ({ over }) =>
              over
                ? t("Activity placed at position {position}.", {
                    position: ids.indexOf(String(over.id)) + 1,
                  })
                : t("Move cancelled."),
            onDragCancel: () => t("Move cancelled."),
          },
        }}
        onDragStart={({ active }) => {
          setActiveId(String(active.id));
          setOverId(String(active.id));
          setDragHeight(active.rect.current.initial?.height);
          setAnnouncement("");
        }}
        onDragOver={({ over }) => setOverId(over ? String(over.id) : null)}
        onDragEnd={finishDrag}
        onDragCancel={() => {
          setActiveId(null);
          setOverId(null);
        }}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ol
            className="thumbnails sortable-thumbnails"
            aria-busy={pending}
            onDragStart={(event) => event.preventDefault()}
          >
            {slides.map((slide, index) => (
              <SortableSlide
                key={slide.id}
                course={course}
                slide={slide}
                position={projected.indexOf(slide.id) + 1}
                index={index}
                count={slides.length}
                editable={editable}
                disabled={locked}
                reducedMotion={reducedMotion}
                selected={course.activeSlideId === slide.id}
                onSelect={() => {
                  if (!activeId) onSelect(slide.id);
                }}
                onMove={(direction) => {
                  const target = slides[index + direction];
                  if (target) void commit(slide.id, target.id);
                }}
              />
            ))}
          </ol>
        </SortableContext>
        {mounted &&
          createPortal(
            <DragOverlay
              adjustScale={false}
              zIndex={25}
              dropAnimation={
                reducedMotion
                  ? null
                  : {
                      duration: 180,
                      easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
                      sideEffects: defaultDropAnimationSideEffects({
                        styles: { active: { opacity: "0" } },
                      }),
                    }
              }
            >
              {activeSlide && (
                <div
                  className="slide-drag-overlay"
                  style={{ height: dragHeight }}
                  aria-hidden="true"
                >
                  <div className="thumbnail">
                    <SlideView course={course} slide={activeSlide} small />
                  </div>
                  <div className="thumbnail-caption">
                    <span>
                      <Icon name="activity" size={13} />
                      {t("Activity")}
                    </span>
                    <div>
                      <span className="mini-button">
                        <Icon name="up" size={14} />
                      </span>
                      <span className="mini-button">
                        <Icon name="down" size={14} />
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </DragOverlay>,
            document.body,
          )}
      </DndContext>
      <p className="sr-only" role="status">
        {announcement}
      </p>
      <div className="rail-bottom">
        <Logo />
      </div>
    </aside>
  );
}

function SortableSlide({
  course,
  slide,
  position,
  index,
  count,
  editable,
  disabled,
  reducedMotion,
  selected,
  onSelect,
  onMove,
}: {
  course: Course;
  slide: Slide;
  position: number;
  index: number;
  count: number;
  editable: boolean;
  disabled: boolean;
  reducedMotion: boolean;
  selected: boolean;
  onSelect: () => void;
  onMove: (direction: number) => void;
}) {
  const { t, locale } = useLocale();
  const movable = editable && slide.kind === "activity" && !disabled;
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: slide.id,
    disabled: { draggable: !movable, droppable: !editable || disabled },
    transition: reducedMotion
      ? null
      : { duration: 180, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
  });
  return (
    <li
      ref={setNodeRef}
      className={`${selected ? "selected" : ""} ${isDragging ? "slide-sort-gap" : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      data-slide-id={slide.id}
    >
      <span className="slide-number">{position}</span>
      <button
        ref={setActivatorNodeRef}
        className={`thumbnail ${movable ? "movable-thumbnail" : ""}`}
        draggable={false}
        {...(movable ? attributes : {})}
        {...(movable ? listeners : {})}
        aria-disabled={disabled || undefined}
        onClick={() => {
          if (!disabled) onSelect();
        }}
        aria-label={`${t("Slide")} ${position}: ${slideTitle(course, slide, locale)}`}
        aria-current={selected ? "true" : undefined}
        aria-roledescription={movable ? t("Movable activity") : undefined}
      >
        <SlideView course={course} slide={slide} small />
      </button>
      {slide.kind === "activity" && (
        <div className="thumbnail-caption">
          <span>
            <Icon name="activity" size={13} />
            {t("Activity")}
          </span>
          {editable && (
            <div>
              <button
                className="mini-button"
                disabled={disabled || index === 0}
                aria-label={t("Move activity up")}
                onClick={() => onMove(-1)}
              >
                <Icon name="up" size={14} />
              </button>
              <button
                className="mini-button"
                disabled={disabled || index === count - 1}
                aria-label={t("Move activity down")}
                onClick={() => onMove(1)}
              >
                <Icon name="down" size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
