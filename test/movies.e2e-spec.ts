import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

const movieData = {
  title: 'Inception',
  director: 'Christopher Nolan',
  genre: 'sci-fi',
  year: 2010,
  rating: 8.8,
  synopsis: 'A thief who steals corporate secrets through the use of dream-sharing technology.',
};

const updateData = {
  rating: 9.0,
  synopsis: 'Updated synopsis for testing purposes.',
};

const invalidUuid = 'not-a-valid-uuid';
const nonExistentUuid = '00000000-0000-4000-a000-000000000000';

describe('Movies E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let createdMovieId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        errorHttpStatusCode: 422,
      }),
    );
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    await dataSource.query('DELETE FROM movies');
  });

  afterAll(async () => {
    await dataSource.query('DELETE FROM movies');
    await app.close();
  });

  describe('GET /movies/search', () => {
    it('debe retornar todas las películas sin filtros', async () => {
      const response = await request(app.getHttpServer()).get('/movies/search');

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
    });

    it('debe filtrar por género', async () => {
      const response = await request(app.getHttpServer()).get('/movies/search?genre=sci-fi');

      expect(response.status).toBe(200);
    });

    it('debe filtrar por año', async () => {
      const response = await request(app.getHttpServer()).get('/movies/search?year=2010');

      expect(response.status).toBe(200);
    });

    it('debe filtrar por minRating', async () => {
      const response = await request(app.getHttpServer()).get('/movies/search?minRating=8.5');

      expect(response.status).toBe(200);
    });

    it('debe combinar género y año', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies/search?genre=sci-fi&year=2010');

      expect(response.status).toBe(200);
    });

    it('debe combinar año y minRating', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies/search?year=2010&minRating=8.5');

      expect(response.status).toBe(200);
    });

    it('debe combinar género y minRating', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies/search?genre=drama&minRating=9.0');

      expect(response.status).toBe(200);
    });

    it('debe combinar los tres filtros', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies/search?genre=drama&year=1994&minRating=9.0');

      expect(response.status).toBe(200);
    });

    it('debe retornar 422 para género inválido', async () => {
      const response = await request(app.getHttpServer()).get('/movies/search?genre=invalid');

      expect(response.status).toBe(422);
    });

    it('debe retornar 422 para año inválido', async () => {
      const response = await request(app.getHttpServer()).get('/movies/search?year=1800');

      expect(response.status).toBe(422);
    });

    it('debe retornar 422 para minRating inválido', async () => {
      const response = await request(app.getHttpServer()).get('/movies/search?minRating=15');

      expect(response.status).toBe(422);
    });
  });

  // Aquí las pruebas
});
