import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAhora } from "./useAhora";

describe("useAhora", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 4, 1, 10, 30));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("devuelve la hora actual", () => {
    const { result } = renderHook(() => useAhora());

    expect(result.current).toBe(new Date(2024, 4, 1, 10, 30).getTime());
  });

  it("se actualiza cada intervalo", () => {
    const { result } = renderHook(() => useAhora(1000));

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current).toBe(new Date(2024, 4, 1, 10, 30, 5).getTime());
  });

  it("deja de actualizarse al desmontar", () => {
    const { result, unmount } = renderHook(() => useAhora(1000));

    unmount();
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current).toBe(new Date(2024, 4, 1, 10, 30).getTime());
  });
});
