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

const seedMovies = [
  { title: 'Inception', director: 'C. Nolan', genre: 'sci-fi', year: 2010, rating: 8.8 },
  { title: 'Interstellar', director: 'C. Nolan', genre: 'sci-fi', year: 2014, rating: 8.6 },
  { title: 'The Godfather', director: 'F. Coppola', genre: 'drama', year: 1972, rating: 9.2 },
  { title: 'Pulp Fiction', director: 'Q. Tarantino', genre: 'drama', year: 1994, rating: 8.9 },
  { title: 'The Dark Knight', director: 'C. Nolan', genre: 'action', year: 2008, rating: 9.0 },
  { title: 'Toy Story', director: 'J. Lasseter', genre: 'animation', year: 1995, rating: 8.3 },
];

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

    for (const movie of seedMovies) {
      await dataSource.query(
        `INSERT INTO movies (title, director, genre, year, rating, synopsis) VALUES ($1, $2, $3, $4, $5, $6)`,
        [movie.title, movie.director, movie.genre, movie.year, movie.rating, ''],
      );
    }
  });

  afterAll(async () => {
    await dataSource.query('DELETE FROM movies');
    await app.close();
  });

  describe('GET /movies/search', () => {
    it('D1: debe retornar las 6 películas sembradas', async () => {
      const response = await request(app.getHttpServer()).get('/movies/search');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(6);
    });

    it('D2: debe filtrar por genre=sci-fi (2 películas)', async () => {
      const response = await request(app.getHttpServer()).get('/movies/search?genre=sci-fi');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      const titles = response.body.map((m: any) => m.title).sort();
      expect(titles).toEqual(['Inception', 'Interstellar']);
    });

    it('D3: debe filtrar por year=1994 (1 película)', async () => {
      const response = await request(app.getHttpServer()).get('/movies/search?year=1994');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('Pulp Fiction');
    });

    it('D4: debe filtrar por minRating=9.0 (2 películas)', async () => {
      const response = await request(app.getHttpServer()).get('/movies/search?minRating=9.0');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      const titles = response.body.map((m: any) => m.title).sort();
      expect(titles).toEqual(['The Dark Knight', 'The Godfather']);
    });

    it('D5: debe combinar genre=drama&minRating=9.0 (1 película)', async () => {
      const response = await request(app.getHttpServer()).get('/movies/search?genre=drama&minRating=9.0');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('The Godfather');
    });

    it('D6: debe retornar array vacío para genre=horror', async () => {
      const response = await request(app.getHttpServer()).get('/movies/search?genre=horror');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });

    it('D7: debe retornar array vacío para year=2030', async () => {
      const response = await request(app.getHttpServer()).get('/movies/search?year=2030');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });

    it('D8: debe retornar 422 para year=invalid', async () => {
      const response = await request(app.getHttpServer()).get('/movies/search?year=invalid');

      expect(response.status).toBe(422);
    });
  });

  describe('POST /movies', () => {
    it('debe crear una película', async () => {
      const response = await request(app.getHttpServer())
        .post('/movies')
        .send(movieData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      createdMovieId = response.body.id;
    });
  });

  describe('GET /movies/:id', () => {
    it('debe obtener una película por id', async () => {
      const response = await request(app.getHttpServer()).get(`/movies/${createdMovieId}`);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe(movieData.title);
    });
  });

  // Aquí las pruebas
});
