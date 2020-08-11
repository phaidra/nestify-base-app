import { IsNotEmpty, MinLength, MaxLength, IsString } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export class LoginUserDto {

  @ApiModelProperty({
    example: 'Name of my Asset',
    description: 'A verbose name for asset uploaded',
    format: 'string',
    uniqueItems: false,
    minLength: 5,
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  readonly name: string;

  @ApiModelProperty({
    example: 'https://arche.acdh.oeaw.ac.at/api/30427',
    description: 'An identifier of the asset in a secondary repository.',
    format: 'string',
    maxLength: 1024,
  })
  @IsString()
  @MaxLength(1024)
  readonly identifier: string;

  @ApiModelProperty({
    example: 'British Museum London',
    description: 'A verbose name or description of the origin of the image.',
    format: 'string',
    maxLength: 1024,
  })
  @IsString()
  @MaxLength(1024)
  readonly source: string;
}
