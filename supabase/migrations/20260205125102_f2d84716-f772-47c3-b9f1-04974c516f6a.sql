-- Fix 1: Add RLS to profiles_public view - restrict to authenticated users only
-- The profiles_public view uses security_invoker=true but needs explicit grants

-- Revoke access from anonymous users
REVOKE ALL ON public.profiles_public FROM anon;
REVOKE ALL ON public.profiles_public FROM public;

-- Grant SELECT only to authenticated users
GRANT SELECT ON public.profiles_public TO authenticated;

-- Fix 2: Ensure labs_public view is properly secured
-- (Already fixed in previous migration, but ensuring consistency)
REVOKE ALL ON public.labs_public FROM anon;
REVOKE ALL ON public.labs_public FROM public;
GRANT SELECT ON public.labs_public TO authenticated;

-- Fix 3: Create a secure view for quiz questions that hides is_correct flag
-- First, create a function to sanitize quiz options (remove is_correct flag)
CREATE OR REPLACE FUNCTION public.sanitize_quiz_options(options jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT jsonb_agg(
    jsonb_build_object(
      'text', option->>'text',
      'id', option->>'id'
    )
  )
  FROM jsonb_array_elements(options) AS option
$$;

-- Create a secure view for quiz questions that students can access
-- This view excludes the is_correct flag from options
CREATE OR REPLACE VIEW public.quiz_questions_public
WITH (security_invoker = true)
AS
SELECT 
  id,
  lesson_id,
  question,
  public.sanitize_quiz_options(options) AS options,
  order_index,
  xp_reward,
  created_at,
  updated_at
FROM public.quiz_questions;

-- Restrict access to authenticated users only
REVOKE ALL ON public.quiz_questions_public FROM anon;
REVOKE ALL ON public.quiz_questions_public FROM public;
GRANT SELECT ON public.quiz_questions_public TO authenticated;

-- Update the RLS policy on quiz_questions to be more restrictive
-- Only admins and answer verification functions should access the full options
DROP POLICY IF EXISTS "Quiz questions are viewable by authenticated users" ON public.quiz_questions;

-- Admins can still see all quiz questions (already have ALL policy)
-- Regular users should use the quiz_questions_public view
-- Create a policy that only allows access to quiz_questions for admins
CREATE POLICY "Only admins can view full quiz questions with answers"
ON public.quiz_questions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create a secure function to verify quiz answers server-side
-- This function validates answers without exposing the correct ones
CREATE OR REPLACE FUNCTION public.verify_quiz_answer(
  p_question_id uuid,
  p_selected_option_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_question RECORD;
  v_option jsonb;
  v_is_correct boolean := false;
  v_correct_text text;
  v_explanation text;
BEGIN
  -- Get the question
  SELECT * INTO v_question
  FROM public.quiz_questions
  WHERE id = p_question_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Question not found');
  END IF;
  
  -- Find the selected option and check if it's correct
  FOR v_option IN SELECT * FROM jsonb_array_elements(v_question.options)
  LOOP
    IF v_option->>'id' = p_selected_option_id THEN
      v_is_correct := COALESCE((v_option->>'is_correct')::boolean, false);
    END IF;
    
    IF COALESCE((v_option->>'is_correct')::boolean, false) THEN
      v_correct_text := v_option->>'text';
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'is_correct', v_is_correct,
    'correct_answer', v_correct_text,
    'explanation', v_question.explanation
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.verify_quiz_answer(uuid, text) TO authenticated;