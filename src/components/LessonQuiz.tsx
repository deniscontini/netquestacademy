import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Trophy, ArrowRight, RotateCcw, Brain, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVerifyAnswer, VerifyAnswerResult } from "@/hooks/useQuiz";

export interface QuizQuestion {
  id: string;
  question: string;
  options: { text: string; id: string }[];
  xp_reward: number;
}

interface LessonQuizProps {
  questions: QuizQuestion[];
  onComplete: (score: number, totalQuestions: number, xpEarned: number) => void;
  isCompleted?: boolean;
  previousScore?: number;
}

const LessonQuiz = ({ questions, onComplete, isCompleted, previousScore }: LessonQuizProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [answers, setAnswers] = useState<{ questionId: string; isCorrect: boolean }[]>([]);
  const [verificationResult, setVerificationResult] = useState<VerifyAnswerResult | null>(null);
  
  const verifyAnswerMutation = useVerifyAnswer();

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswer = async () => {
    if (!selectedAnswer || hasAnswered) return;

    // Get the selected option ID
    const selectedOptionId = selectedAnswer;

    try {
      // Verify the answer server-side
      const result = await verifyAnswerMutation.mutateAsync({
        questionId: currentQuestion.id,
        selectedOptionId,
      });

      setVerificationResult(result);
      setHasAnswered(true);
      setAnswers([...answers, { questionId: currentQuestion.id, isCorrect: result.is_correct }]);

      if (result.is_correct) {
        setScore(score + 1);
        setXpEarned(xpEarned + currentQuestion.xp_reward);
      }
    } catch (error) {
      console.error("Error verifying answer:", error);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setHasAnswered(false);
      setVerificationResult(null);
    } else {
      setShowResults(true);
      onComplete(score, questions.length, xpEarned);
    }
  };

  const handleRetry = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setHasAnswered(false);
    setScore(0);
    setXpEarned(0);
    setShowResults(false);
    setAnswers([]);
    setVerificationResult(null);
  };

  if (questions.length === 0) return null;

  // Show completed state
  if (isCompleted && !showResults && previousScore !== undefined) {
    return (
      <Card className="mt-8 border-accent/30 bg-accent/5">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Quiz Concluído!</h4>
                <p className="text-sm text-muted-foreground">
                  Você acertou {previousScore} de {questions.length} questões
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleRetry} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Refazer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show final results
  if (showResults) {
    const percentage = Math.round((score / questions.length) * 100);
    const isPassing = percentage >= 70;

    return (
      <Card className="mt-8 border-border">
        <CardHeader className="text-center pb-4">
          <div className={cn(
            "w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center",
            isPassing ? "bg-accent/20" : "bg-destructive/20"
          )}>
            {isPassing ? (
              <Trophy className="w-10 h-10 text-accent" />
            ) : (
              <Brain className="w-10 h-10 text-destructive" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {isPassing ? "Parabéns!" : "Continue estudando!"}
          </CardTitle>
          <CardDescription>
            {isPassing 
              ? "Você demonstrou um excelente entendimento do conteúdo!"
              : "Revise o conteúdo e tente novamente para melhorar sua pontuação."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-foreground">{score}</p>
              <p className="text-sm text-muted-foreground">Acertos</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-foreground">{questions.length}</p>
              <p className="text-sm text-muted-foreground">Questões</p>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg">
              <p className="text-3xl font-bold text-primary">+{xpEarned}</p>
              <p className="text-sm text-muted-foreground">XP</p>
            </div>
          </div>

          <Progress value={percentage} className="h-3" />
          <p className="text-center text-muted-foreground">
            Taxa de acerto: <span className="font-semibold text-foreground">{percentage}%</span>
          </p>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={handleRetry} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Refazer Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show quiz question
  return (
    <Card className="mt-8 border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="gap-1">
            <Brain className="w-3 h-3" />
            Quiz de Fixação
          </Badge>
          <Badge variant="xp" className="font-mono">
            +{currentQuestion.xp_reward} XP
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Questão {currentQuestionIndex + 1} de {questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <h4 className="text-lg font-medium text-foreground leading-relaxed">
          {currentQuestion.question}
        </h4>

        <RadioGroup
          value={selectedAnswer || ""}
          onValueChange={setSelectedAnswer}
          disabled={hasAnswered}
          className="space-y-3"
        >
          {currentQuestion.options.map((option) => {
            const isSelected = selectedAnswer === option.id;
            const isCorrectAnswer = hasAnswered && verificationResult?.correct_answer === option.text;
            const isWrongSelection = hasAnswered && isSelected && !verificationResult?.is_correct;
            
            let optionStyle = "border-border hover:border-primary/50";
            if (hasAnswered) {
              if (isCorrectAnswer) {
                optionStyle = "border-accent bg-accent/10";
              } else if (isWrongSelection) {
                optionStyle = "border-destructive bg-destructive/10";
              }
            } else if (isSelected) {
              optionStyle = "border-primary bg-primary/5";
            }

            return (
              <Label
                key={option.id}
                htmlFor={option.id}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all",
                  optionStyle,
                  hasAnswered && "cursor-default"
                )}
              >
                <RadioGroupItem value={option.id} id={option.id} />
                <span className="flex-1 text-foreground">{option.text}</span>
                {hasAnswered && isCorrectAnswer && (
                  <CheckCircle className="w-5 h-5 text-accent" />
                )}
                {isWrongSelection && (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
              </Label>
            );
          })}
        </RadioGroup>

        {/* Explanation */}
        {hasAnswered && verificationResult?.explanation && (
          <div className="p-4 bg-muted/50 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Explicação:</span>{" "}
              {verificationResult.explanation}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          {!hasAnswered ? (
            <Button 
              onClick={handleAnswer} 
              disabled={!selectedAnswer || verifyAnswerMutation.isPending}
              className="gap-2"
            >
              {verifyAnswerMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Confirmar Resposta"
              )}
            </Button>
          ) : (
            <Button onClick={handleNext} className="gap-2">
              {currentQuestionIndex < questions.length - 1 ? (
                <>
                  Próxima Questão
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Ver Resultado
                  <Trophy className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LessonQuiz;
