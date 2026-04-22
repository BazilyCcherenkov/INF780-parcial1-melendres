import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { Movie } from './entities/movie.entity';
import { Genre } from './entities/movie.entity';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { SearchMoviesDto } from './dto/search-movies.dto';

type MockRepository<T extends ObjectLiteral = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T extends ObjectLiteral = any>(): MockRepository<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
  merge: jest.fn(),
  remove: jest.fn(),
});

const movieData: CreateMovieDto = {
  title: 'Inception',
  director: 'Christopher Nolan',
  genre: Genre.SCIFI,
  year: 2010,
  rating: 8.8,
  synopsis: 'A thief who steals corporate secrets through the use of dream-sharing technology.',
};

const mockMovie: Movie = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: movieData.title,
  director: movieData.director,
  genre: movieData.genre,
  year: movieData.year,
  rating: movieData.rating,
  synopsis: movieData.synopsis ?? '',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('MoviesService', () => {
  let service: MoviesService;
  let repository: MockRepository<Movie>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        {
          provide: getRepositoryToken(Movie),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
    repository = module.get<MockRepository<Movie>>(getRepositoryToken(Movie));
  });

  // Prueba 1
  it('El servicio debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('search', () => {
    it('debe buscar películas sin filtros', async () => {
      const movies = [mockMovie];
      repository.find = jest.fn().mockResolvedValue(movies);

      const result = await service.search({});

      expect(repository.find).toHaveBeenCalledWith({ where: {} });
      expect(result).toEqual(movies);
    });

    it('debe buscar por género', async () => {
      repository.find = jest.fn().mockResolvedValue([mockMovie]);

      await service.search({ genre: Genre.SCIFI });

      expect(repository.find).toHaveBeenCalledWith({
        where: { genre: Genre.SCIFI },
      });
    });

    it('debe buscar por año', async () => {
      repository.find = jest.fn().mockResolvedValue([mockMovie]);

      await service.search({ year: 2010 });

      expect(repository.find).toHaveBeenCalledWith({
        where: { year: 2010 },
      });
    });

    it('debe combinar filtros género y año', async () => {
      repository.find = jest.fn().mockResolvedValue([mockMovie]);

      await service.search({
        genre: Genre.SCIFI,
        year: 2010,
      });

      expect(repository.find).toHaveBeenCalledWith({
        where: { genre: Genre.SCIFI, year: 2010 },
      });
    });

    it('debe filtrar minRating en memoria', async () => {
      const moviesWithDifferentRatings = [
        { ...mockMovie, rating: 5.0 },
        { ...mockMovie, id: '2', rating: 8.0 },
      ];
      repository.find = jest.fn().mockResolvedValue(moviesWithDifferentRatings);

      const result = await service.search({ minRating: 7.0 });

      expect(result).toHaveLength(1);
      expect(result[0].rating).toBe(8.0);
    });

    it('debe combinar los tres filtros', async () => {
      repository.find = jest.fn().mockResolvedValue([mockMovie]);

      const result = await service.search({
        genre: Genre.SCIFI,
        year: 2010,
        minRating: 7.0,
      });

      expect(repository.find).toHaveBeenCalledWith({
        where: { genre: Genre.SCIFI, year: 2010 },
      });
      expect(result).toHaveLength(1);
    });
  });

  // Aquí las pruebas
});
