import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, NotFoundException } from '@nestjs/common';
import request from 'supertest';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { Genre } from './entities/movie.entity';
import { Movie } from './entities/movie.entity';

const mockMoviesService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  search: jest.fn(),
};

const movieData = {
  title: 'Inception',
  director: 'Christopher Nolan',
  genre: 'sci-fi',
  year: 2010,
  rating: 8.8,
  synopsis: 'A thief who steals corporate secrets through the use of dream-sharing technology.',
};

const mockMovie: Movie = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Inception',
  director: 'Christopher Nolan',
  genre: Genre.SCIFI,
  year: 2010,
  rating: 8.8,
  synopsis: 'A thief who steals corporate secrets through the use of dream-sharing technology.',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const validUuid = '550e8400-e29b-41d4-a716-446655440000';
const invalidUuid = 'not-a-valid-uuid';
const nonExistentUuid = '00000000-0000-4000-a000-000000000000';

describe('MoviesController (Integration)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MoviesController],
      providers: [
        {
          provide: MoviesService,
          useValue: mockMoviesService,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        errorHttpStatusCode: 422,
      }),
    );
    await app.init();

    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /movies/search', () => {
    it('C1: debe retornar todas las películas sin filtros', async () => {
      mockMoviesService.search.mockResolvedValue([mockMovie]);

      const response = await request(app.getHttpServer()).get('/movies/search');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(mockMoviesService.search).toHaveBeenCalledWith({});
    });

    it('C2: debe filtrar por género', async () => {
      mockMoviesService.search.mockResolvedValue([mockMovie]);

      const response = await request(app.getHttpServer()).get('/movies/search?genre=drama');

      expect(response.status).toBe(200);
      expect(mockMoviesService.search).toHaveBeenCalledWith({ genre: Genre.DRAMA });
    });

    it('C3: debe convertir query params a números', async () => {
      mockMoviesService.search.mockResolvedValue([mockMovie]);

      const response = await request(app.getHttpServer()).get('/movies/search?year=2010&minRating=8.5');

      expect(response.status).toBe(200);
      expect(mockMoviesService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          year: expect.any(Number),
          minRating: expect.any(Number),
        }),
      );
      const callArgs = mockMoviesService.search.mock.calls[0][0];
      expect(callArgs.year).toBe(2010);
      expect(callArgs.minRating).toBe(8.5);
    });

    it('C4: debe retornar 422 para género inválido', async () => {
      const response = await request(app.getHttpServer()).get('/movies/search?genre=unknown');

      expect(response.status).toBe(422);
      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/genre/i),
        ]),
      );
    });

    it('C5: debe retornar 422 para año fuera de rango', async () => {
      const response = await request(app.getHttpServer()).get('/movies/search?year=1500');

      expect(response.status).toBe(422);
      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/year/i),
        ]),
      );
    });

    it('C6: debe retornar 422 para minRating fuera de rango', async () => {
      const response = await request(app.getHttpServer()).get('/movies/search?minRating=11');

      expect(response.status).toBe(422);
      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/minRating/i),
        ]),
      );
    });
  });

  // Aquí las pruebas
});
