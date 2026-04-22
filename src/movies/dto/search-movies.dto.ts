import { IsOptional, IsEnum, IsInt, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Genre } from '../entities/movie.entity';

export class SearchMoviesDto {
  @ApiPropertyOptional({ enum: Genre, description: 'Filtrar por género', example: 'sci-fi' })
  @IsOptional()
  @IsEnum(Genre, { message: 'genre must be a valid Genre: action, comedy, drama, horror, sci-fi, thriller, romance, documentary, animation' })
  genre?: Genre;

  @ApiPropertyOptional({ example: 2010, description: 'Año de la película', minimum: 1888, maximum: 2030 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'year must be an integer' })
  @Min(1888, { message: 'year must be between 1888 and 2030' })
  @Max(2030, { message: 'year must be between 1888 and 2030' })
  year?: number;

  @ApiPropertyOptional({ example: 8.5, description: 'Rating mínimo', minimum: 0, maximum: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'minRating must be a number' })
  @Min(0, { message: 'minRating must be between 0.0 and 10.0' })
  @Max(10, { message: 'minRating must be between 0.0 and 10.0' })
  minRating?: number;
}