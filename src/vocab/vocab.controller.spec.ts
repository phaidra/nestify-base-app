import { Test, TestingModule } from '@nestjs/testing';
import { VocabController } from './vocab.controller';

describe('Vocab Controller', () => {
  let controller: VocabController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VocabController],
    }).compile();

    controller = module.get<VocabController>(VocabController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
