import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Concept } from './Interfaces/concept.interface';
import { Authrec } from './Interfaces/authrec.interface';

@Injectable()
export class VocabService {
  constructor(
    @InjectModel('Concept') private readonly conceptModel: Model<Concept>,
    @InjectModel('Authrec') private readonly authrecModel: Model<Authrec>,
  ) {}
}
