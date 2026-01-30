/**
 * Tests for api_proccesor.js v2 API compatibility
 */

global.fetch = jest.fn();

const {
  FCC_BASE_URL,
  AVAILABLE_SUPER_BLOCKS,
  getAllTitlesAndDashedNamesSuperblockJSONArray,
  getAllSuperblockTitlesAndDashedNames,
  getDashedNamesURLs,
  getNonDashedNamesURLs
} = require('../../util/api_proccesor');

describe('api_proccesor v2 API compatibility', () => {
  const mockV2SuperblocksResponse = {
    superblocks: {
      core: [
        {
          dashedName: 'responsive-web-design-v9',
          title: 'Responsive Web Design (v9)'
        },
        {
          dashedName: 'javascript-v9',
          title: 'JavaScript Algorithms and Data Structures (v9)'
        }
      ],
      legacy: [
        {
          dashedName: 'responsive-web-design',
          title: 'Responsive Web Design (Legacy)'
        }
      ],
      english: [
        {
          dashedName: 'front-end-development-libraries',
          title: 'Front End Development Libraries'
        }
      ],
      extra: [{ dashedName: 'project-euler', title: 'Project Euler' }],
      professional: [
        {
          dashedName: 'foundational-c-sharp',
          title: 'Foundational C# with Microsoft'
        }
      ]
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should use v2 API base URL', () => {
      expect(FCC_BASE_URL).toBe(
        'https://www.freecodecamp.org/curriculum-data/v2'
      );
    });

    it('should construct correct available-superblocks endpoint', () => {
      expect(AVAILABLE_SUPER_BLOCKS).toBe(
        'https://www.freecodecamp.org/curriculum-data/v2/available-superblocks.json'
      );
    });
  });

  describe('getAllTitlesAndDashedNamesSuperblockJSONArray()', () => {
    it('should fetch and flatten v2 superblocks structure', async () => {
      global.fetch.mockResolvedValueOnce({
        json: async () => mockV2SuperblocksResponse
      });

      const result = await getAllTitlesAndDashedNamesSuperblockJSONArray();

      expect(global.fetch).toHaveBeenCalledWith(AVAILABLE_SUPER_BLOCKS);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(6);
      expect(result[0].dashedName).toBe('responsive-web-design-v9');
      expect(result[1].dashedName).toBe('javascript-v9');
      expect(result[2].dashedName).toBe('responsive-web-design');
    });

    it('should handle v1 structure without changes', async () => {
      const v1Response = {
        superblocks: [
          {
            dashedName: 'responsive-web-design',
            title: 'Responsive Web Design'
          },
          {
            dashedName: 'javascript-algorithms-and-data-structures',
            title: 'JavaScript'
          }
        ]
      };

      global.fetch.mockResolvedValueOnce({
        json: async () => v1Response
      });

      const result = await getAllTitlesAndDashedNamesSuperblockJSONArray();

      expect(result).toEqual(v1Response.superblocks);
    });
  });

  describe('getAllSuperblockTitlesAndDashedNames()', () => {
    it('should transform superblocks into title/dashedName mapping', async () => {
      global.fetch.mockResolvedValueOnce({
        json: async () => mockV2SuperblocksResponse
      });

      const result = await getAllSuperblockTitlesAndDashedNames();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(6);

      result.forEach(mapping => {
        expect(mapping).toHaveProperty('superblockDashedName');
        expect(mapping).toHaveProperty('superblockReadableTitle');
      });
    });
  });

  describe('getDashedNamesURLs()', () => {
    it('should generate correct URLs for v2 API using dashed names', async () => {
      const result = await getDashedNamesURLs([
        'responsive-web-design-v9',
        'javascript-v9',
        'responsive-web-design'
      ]);

      expect(result).toEqual([
        'https://www.freecodecamp.org/curriculum-data/v2/responsive-web-design-v9.json',
        'https://www.freecodecamp.org/curriculum-data/v2/javascript-v9.json',
        'https://www.freecodecamp.org/curriculum-data/v2/responsive-web-design.json'
      ]);
    });

    it('should return empty array for empty input', async () => {
      const result = await getDashedNamesURLs([]);
      expect(result).toEqual([]);
    });
  });

  describe('getNonDashedNamesURLs()', () => {
    it('should return titles for given dashed names', async () => {
      global.fetch.mockResolvedValueOnce({
        json: async () => mockV2SuperblocksResponse
      });

      const result = await getNonDashedNamesURLs([
        'responsive-web-design-v9',
        'javascript-v9',
        'project-euler'
      ]);

      expect(result).toEqual([
        'Responsive Web Design (v9)',
        'JavaScript Algorithms and Data Structures (v9)',
        'Project Euler'
      ]);
    });

    it('should return empty array for empty input', async () => {
      const result = await getNonDashedNamesURLs([]);
      expect(result).toEqual([]);
    });
  });
});
