import { nstAbbreviation } from "../src/api/utils";

describe("src/api/utils", () => {
  test("returns abbreviation for a known team", () => {
    expect(nstAbbreviation("Calgary Flames")).toBe("CGY");
  });

  test("normalizes accented characters before lookup", () => {
    expect(nstAbbreviation("Montréal Canadiens")).toBe("MTL");
  });

  test("returns undefined for an unknown team", () => {
    expect(nstAbbreviation("Quebec Nordiques")).toBeUndefined();
  });
});
