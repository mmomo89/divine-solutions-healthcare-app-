import React, { useState } from "react";

interface DragReorderListProps<T> {
  items: T[];
  keyField: keyof T;
  onReorder: (newItems: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
}

/**
 * A minimal, dependency-free drag-and-drop reorder list.
 * Each row gets a drag handle; dropping a row reorders the local array and
 * calls onReorder with the new order so the caller can persist it (and
 * recompute sort_order values) via the backend's /reorder/ endpoint.
 */
function DragReorderList<T>({ items, keyField, onReorder, renderItem }: DragReorderListProps<T>) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const handleDrop = (dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const next = [...items];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(dropIndex, 0, moved);
    onReorder(next);
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <div>
      {items.map((item, index) => (
        <div
          key={String(item[keyField])}
          draggable
          onDragStart={() => setDragIndex(index)}
          onDragOver={(e) => {
            e.preventDefault();
            if (overIndex !== index) setOverIndex(index);
          }}
          onDragLeave={() => setOverIndex((cur) => (cur === index ? null : cur))}
          onDrop={() => handleDrop(index)}
          onDragEnd={() => {
            setDragIndex(null);
            setOverIndex(null);
          }}
          style={{
            outline: overIndex === index && dragIndex !== null && dragIndex !== index ? "2px dashed var(--adm-accent)" : "none",
            outlineOffset: 2,
            opacity: dragIndex === index ? 0.4 : 1,
            transition: "opacity 0.15s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span
              style={{
                cursor: "grab",
                padding: "6px 4px",
                color: "var(--adm-muted)",
                userSelect: "none",
                lineHeight: 1,
                fontSize: "1rem",
                marginTop: 6,
              }}
              title="Drag to reorder"
              aria-hidden="true"
            >
              {"\u2630"}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>{renderItem(item, index)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default DragReorderList;
