import { describe, test, expect, beforeEach } from "vitest";
import {
  setHasAnonWork,
  getHasAnonWork,
  getAnonWorkData,
  clearAnonWork,
} from "@/lib/anon-work-tracker";

describe("anon-work-tracker", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  describe("setHasAnonWork", () => {
    test("stores work when messages are present", () => {
      setHasAnonWork([{ role: "user", content: "hello" }], {});
      expect(getHasAnonWork()).toBe(true);
    });

    test("stores work when file system has more than root", () => {
      setHasAnonWork([], { "/": {}, "/App.jsx": {} });
      expect(getHasAnonWork()).toBe(true);
    });

    test("does not store work when empty messages and only root exists", () => {
      setHasAnonWork([], { "/": {} });
      expect(getHasAnonWork()).toBe(false);
    });

    test("does not store work when both are empty", () => {
      setHasAnonWork([], {});
      expect(getHasAnonWork()).toBe(false);
    });
  });

  describe("getHasAnonWork", () => {
    test("returns false when no work is stored", () => {
      expect(getHasAnonWork()).toBe(false);
    });

    test("returns true after work is set", () => {
      setHasAnonWork([{ role: "user", content: "test" }], {});
      expect(getHasAnonWork()).toBe(true);
    });
  });

  describe("getAnonWorkData", () => {
    test("returns null when no data is stored", () => {
      expect(getAnonWorkData()).toBeNull();
    });

    test("returns stored messages and file system data", () => {
      const messages = [{ role: "user", content: "build a counter" }];
      const fileSystemData = { "/": {}, "/App.jsx": { content: "code" } };
      setHasAnonWork(messages, fileSystemData);

      const result = getAnonWorkData();
      expect(result).toEqual({ messages, fileSystemData });
    });

    test("returns null for corrupted JSON data", () => {
      sessionStorage.setItem("uigen_anon_data", "not-valid-json{{{");
      expect(getAnonWorkData()).toBeNull();
    });
  });

  describe("clearAnonWork", () => {
    test("removes all stored work data", () => {
      setHasAnonWork([{ role: "user", content: "test" }], { "/": {}, "/a": {} });
      expect(getHasAnonWork()).toBe(true);
      expect(getAnonWorkData()).not.toBeNull();

      clearAnonWork();
      expect(getHasAnonWork()).toBe(false);
      expect(getAnonWorkData()).toBeNull();
    });

    test("does not throw when nothing to clear", () => {
      expect(() => clearAnonWork()).not.toThrow();
    });
  });
});
