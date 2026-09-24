import axios from "axios";
import { fetchGameDetails } from "../src/api/scoutingTheRefs";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("src/api/scoutingTheRefs", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchGameDetails", () => {
    it("returns empty structure when no posts exist", async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [] });

      const details = await fetchGameDetails("New Jersey Devils");
      expect(details).toEqual({
        referees: [],
        linesmens: [],
        confirmed: false,
      });
    });

    it("parses correctly from valid markup", async () => {
      // Stub a date object to always return today's date for 'isToday' comparisons
      const mockDate = new Date().toISOString();

      const htmlContent = `
        <h1>New Jersey Devils vs New York Rangers</h1>
        <table>
          <tbody>
            <tr><td>Referees</td></tr>
            <tr><td>Ref1</td><td>Ref2</td></tr>
            <tr><td>23-24</td></tr>
            <tr><td>100</td><td>50</td></tr>
            <tr><td>career games</td></tr>
            <tr><td>200</td><td>150</td></tr>
            <tr><td>penl/gm</td></tr>
            <tr><td>1.5</td><td>2.0</td></tr>
            <tr><td>Linespersons</td></tr>
            <tr><td>Line1</td><td>Line2</td></tr>
            <tr><td>23-24</td></tr>
            <tr><td>10</td><td>20</td></tr>
            <tr><td>career games</td></tr>
            <tr><td>5</td><td>15</td></tr>
          </tbody>
        </table>
      `;

      mockedAxios.get.mockResolvedValueOnce({
        data: [
          {
            id: 1,
            date: mockDate,
            categories: [921],
            title: { rendered: "NHL Referees and Linesmen" },
            content: { rendered: htmlContent },
          },
        ],
      });

      const details = await fetchGameDetails("New Jersey Devils");

      expect(details.confirmed).toBe(true);
      expect(details.referees).toHaveLength(2);
      expect(details.linesmens).toHaveLength(2);

      expect(details.referees[0].name).toBe("Ref1");
      expect(details.referees[0].totalgames).toBe(300); // 100 + 200

      expect(details.linesmens[0].name).toBe("Line1");
      expect(details.linesmens[0].totalgames).toBe(15); // 10 + 5
    });

    it("returns empty structure on network failure", async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error("Network Error"));

      const details = await fetchGameDetails("New Jersey Devils");
      expect(details).toEqual({
        referees: [],
        linesmens: [],
        confirmed: false,
      });
    });
  });
});
