// Agent orchestrator for roleplay generation workflow
import type { RoleplayDesign } from '~/types/roleplay'
import type { UploadedFile } from '~/types/file'
import type { AgentRequest, AgentResponse } from '~/types/agent'

export const useAgentOrchestrator = () => {
  const isGenerating = ref(false)
  const currentStep = ref('')
  const error = ref<string | null>(null)

  /**
   * Generate complete roleplay including scripts and system prompts
   */
  async function generateRoleplay(
    design: RoleplayDesign,
    files: UploadedFile[]
  ): Promise<{
    scripts: {
      subtitle?: any
      points?: any
      practice?: any
    }
    systemPrompts: {
      subtitle?: string
      aiDemo?: string
      confirmation?: string
      practice?: string
    }
  }> {
    isGenerating.value = true
    error.value = null

    try {
      // Step 1: Generate subtitle script
      currentStep.value = '台本(字幕モード)を生成中...'
      const subtitleScript = await callAgent('script-generation-subtitle', {
        roleplayDesign: design,
        files
      })

      // Step 2: Generate points script
      currentStep.value = '台本(ポイントモード)を生成中...'
      const pointsScript = await callAgent('script-generation-points', {
        roleplayDesign: design,
        files
      })

      // Step 3: Generate practice script
      currentStep.value = '台本(練習モード)を生成中...'
      const practiceScript = await callAgent('script-generation-practice', {
        roleplayDesign: design,
        files
      })

      // Step 4: Generate system prompts for each mode
      currentStep.value = 'システムプロンプトを生成中...'
      
      const subtitlePrompt = await callAgent('system-prompt-subtitle', {
        roleplayDesign: design,
        script: subtitleScript
      })

      const aiDemoPrompt = await callAgent('system-prompt-aiDemo', {
        roleplayDesign: design,
        script: subtitleScript
      })

      const confirmationPrompt = await callAgent('system-prompt-confirmation', {
        roleplayDesign: design,
        script: pointsScript
      })

      const practicePrompt = await callAgent('system-prompt-practice', {
        roleplayDesign: design,
        script: practiceScript
      })

      currentStep.value = '完了'
      
      return {
        scripts: {
          subtitle: subtitleScript,
          points: pointsScript,
          practice: practiceScript
        },
        systemPrompts: {
          subtitle: subtitlePrompt.response,
          aiDemo: aiDemoPrompt.response,
          confirmation: confirmationPrompt.response,
          practice: practicePrompt.response
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'ロープレ生成に失敗しました'
      throw err
    } finally {
      isGenerating.value = false
      currentStep.value = ''
    }
  }

  /**
   * Call a specific AI agent
   */
  async function callAgent(
    agentType: string,
    context: any
  ): Promise<AgentResponse> {
    const request: AgentRequest = {
      agent: agentType as any,
      context
    }

    const response = await $fetch<AgentResponse>('/api/agents', {
      method: 'POST',
      body: request
    })

    if (response.error) {
      throw new Error(response.error)
    }

    return response
  }

  /**
   * Get chat support from AI
   */
  async function getChatSupport(
    userInput: string,
    conversationLog?: any[],
    files?: UploadedFile[]
  ): Promise<string> {
    const response = await callAgent('roleplay-support', {
      userInput,
      conversationLog,
      files
    })

    return response.message || response.response || ''
  }

  /**
   * Get feedback for roleplay session
   */
  async function getFeedback(
    design: RoleplayDesign,
    transcript: string
  ): Promise<{
    score: number
    feedback: string
    achievements: string[]
    improvements: string[]
  }> {
    const response = await callAgent('feedback', {
      roleplayDesign: design,
      userInput: transcript
    })

    return response.feedback || {
      score: 0,
      feedback: '',
      achievements: [],
      improvements: []
    }
  }

  return {
    isGenerating: readonly(isGenerating),
    currentStep: readonly(currentStep),
    error: readonly(error),
    generateRoleplay,
    getChatSupport,
    getFeedback
  }
}
