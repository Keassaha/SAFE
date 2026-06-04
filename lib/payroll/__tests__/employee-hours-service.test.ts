import { describe, it, expect } from "vitest";
import {
  canWithdrawHours,
  canReviewHours,
  isValidHours,
  summarizeHours,
} from "@/lib/payroll/employee-hours-service";

describe("employee-hours helpers", () => {
  describe("isValidHours", () => {
    it("accepte une valeur dans (0, 24]", () => {
      expect(isValidHours(0.5)).toBe(true);
      expect(isValidHours(8)).toBe(true);
      expect(isValidHours(24)).toBe(true);
    });
    it("rejette 0, négatif, > 24, NaN, Infinity", () => {
      expect(isValidHours(0)).toBe(false);
      expect(isValidHours(-3)).toBe(false);
      expect(isValidHours(25)).toBe(false);
      expect(isValidHours(Number.NaN)).toBe(false);
      expect(isValidHours(Number.POSITIVE_INFINITY)).toBe(false);
    });
  });

  describe("canWithdrawHours", () => {
    it("permet le retrait par l'employée tant que submitted", () => {
      expect(canWithdrawHours("submitted", "emp-1", "emp-1")).toBe(true);
    });
    it("refuse si pas la même employée", () => {
      expect(canWithdrawHours("submitted", "emp-1", "emp-2")).toBe(false);
    });
    it("refuse si déjà approuvée/rejetée/payée", () => {
      expect(canWithdrawHours("approved", "emp-1", "emp-1")).toBe(false);
      expect(canWithdrawHours("rejected", "emp-1", "emp-1")).toBe(false);
      expect(canWithdrawHours("paid", "emp-1", "emp-1")).toBe(false);
    });
  });

  describe("canReviewHours", () => {
    it("n'autorise l'approbation/rejet que sur submitted", () => {
      expect(canReviewHours("submitted")).toBe(true);
      expect(canReviewHours("approved")).toBe(false);
      expect(canReviewHours("rejected")).toBe(false);
      expect(canReviewHours("paid")).toBe(false);
    });
  });

  describe("summarizeHours", () => {
    it("agrège par statut et calcule la paye attendue", () => {
      const s = summarizeHours(
        [
          { hours: 5, status: "submitted" },
          { hours: 3, status: "submitted" },
          { hours: 10, status: "approved" },
          { hours: 2, status: "paid" },
          { hours: 4, status: "rejected" },
        ],
        20,
      );
      expect(s.submittedHours).toBe(8);
      expect(s.approvedHours).toBe(10);
      expect(s.paidHours).toBe(2);
      expect(s.rejectedCount).toBe(1);
      expect(s.expectedPay).toBe(200); // 10 * 20
      expect(s.paidPay).toBe(40); // 2 * 20
    });

    it("arrondit à 2 décimales et gère une liste vide", () => {
      const empty = summarizeHours([], 25);
      expect(empty.submittedHours).toBe(0);
      expect(empty.expectedPay).toBe(0);
      const frac = summarizeHours([{ hours: 1.005, status: "approved" }], 33.33);
      expect(frac.expectedPay).toBe(Math.round(1.005 * 33.33 * 100) / 100);
    });
  });
});
