export interface EchoBuildRecommendation {
  sonataSet: string;
  pieceCount?: number;
  layout?: number[];
  mainEcho?: string;
  mainStat?: string;
  secondarySet?: string;
  secondaryPieceCount?: number;
}

export const ECHO_SET_RECOMMENDATIONS: Record<string, EchoBuildRecommendation> = {
  aemeath: {
    sonataSet: "Trailblazing Star",
  },
  augusta: {
    sonataSet: "Crown of Valor",
    pieceCount: 3,
    secondarySet: "Void Thunder",
    secondaryPieceCount: 2,
  },
};
