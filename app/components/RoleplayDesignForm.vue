<template>
  <div class="cc-roleplay-design-container">
    <!-- ① シチュエーション -->
    <div class="cc-design-section">
      <div class="cc-design-section-header">
        <span class="cc-design-section-number">①</span>
        <span class="cc-design-section-title">シチュエーション</span>
      </div>
      <textarea
        v-model="design.situation"
        class="cc-design-textarea"
        placeholder="プレイヤーが置かれた状況を300文字以内で記載してください。&#10;- 自分は誰か&#10;- 相手は誰か&#10;- 初対面なのか、関係性があるのか&#10;- このレッスンで何をしなければならないか"
      ></textarea>
    </div>

    <!-- ② 相手の設定 -->
    <div class="cc-design-section">
      <div class="cc-design-section-header">
        <span class="cc-design-section-number">②</span>
        <span class="cc-design-section-title">相手の設定</span>
      </div>
      <textarea
        v-model="design.opponentSetting"
        class="cc-design-textarea"
        placeholder="相手の設定を記載してください。&#10;- 相手の立場・役職&#10;- 相手の性格・特徴&#10;- 相手が抱えている課題や状況"
      ></textarea>
    </div>

    <!-- ③ ミッション -->
    <div class="cc-design-section">
      <div class="cc-design-section-header">
        <span class="cc-design-section-number">③</span>
        <span class="cc-design-section-title">ミッション</span>
      </div>
      <div class="cc-mission-container">
        <!-- 必須ミッション -->
        <div class="cc-mission-category">
          <div class="cc-mission-category-header cc-mission-required">
            <span class="cc-mission-badge">必須</span>
            <span>絶対にやらないといけないこと</span>
          </div>
          <div class="cc-mission-items">
            <div
              v-for="(item, index) in design.missions.required"
              :key="`required-${index}`"
              class="cc-mission-item"
            >
              <input
                type="text"
                v-model="design.missions.required[index]"
                class="cc-mission-input"
                placeholder="必須タスクを入力"
              >
              <button class="cc-mission-remove" @click="removeMissionItem('required', index)">×</button>
            </div>
          </div>
          <button class="cc-mission-add" @click="addMissionItem('required')">+ 追加</button>
        </div>

        <!-- 採点ミッション -->
        <div class="cc-mission-category">
          <div class="cc-mission-category-header cc-mission-scoring">
            <span class="cc-mission-badge">採点</span>
            <span>やらないと減点対象になる内容</span>
          </div>
          <div class="cc-mission-items">
            <div
              v-for="(item, index) in design.missions.scoring"
              :key="`scoring-${index}`"
              class="cc-mission-item"
            >
              <input
                type="text"
                v-model="design.missions.scoring[index]"
                class="cc-mission-input"
                placeholder="採点タスクを入力"
              >
              <button class="cc-mission-remove" @click="removeMissionItem('scoring', index)">×</button>
            </div>
          </div>
          <button class="cc-mission-add" @click="addMissionItem('scoring')">+ 追加</button>
        </div>

        <!-- 失敗ミッション -->
        <div class="cc-mission-category">
          <div class="cc-mission-category-header cc-mission-failure">
            <span class="cc-mission-badge">失敗</span>
            <span>この条件を満たしたら必ず失敗</span>
          </div>
          <div class="cc-mission-items">
            <div
              v-for="(item, index) in design.missions.failure"
              :key="`failure-${index}`"
              class="cc-mission-item"
            >
              <input
                type="text"
                v-model="design.missions.failure[index]"
                class="cc-mission-input"
                placeholder="失敗条件を入力"
              >
              <button class="cc-mission-remove" @click="removeMissionItem('failure', index)">×</button>
            </div>
          </div>
          <button class="cc-mission-add" @click="addMissionItem('failure')">+ 追加</button>
        </div>
      </div>
    </div>

    <!-- ④ ポイント -->
    <div class="cc-design-section">
      <div class="cc-design-section-header">
        <span class="cc-design-section-number">④</span>
        <span class="cc-design-section-title">ポイント</span>
      </div>
      <div class="cc-points-container">
        <div
          v-for="(point, index) in design.points"
          :key="`point-${index}`"
          class="cc-point-item"
        >
          <div class="cc-point-question">
            <label class="cc-point-label">（問）</label>
            <textarea
              v-model="point.question"
              class="cc-point-textarea"
              placeholder="質問内容を入力"
            ></textarea>
          </div>
          <div class="cc-point-criteria">
            <label class="cc-point-label">（正解基準）</label>
            <textarea
              v-model="point.criteria"
              class="cc-point-textarea"
              placeholder="・ポイント1&#10;・ポイント2"
            ></textarea>
          </div>
          <div class="cc-point-example">
            <label class="cc-point-label">（正答例）</label>
            <textarea
              v-model="point.example"
              class="cc-point-textarea"
              placeholder="具体的な回答例を入力"
            ></textarea>
          </div>
          <button class="cc-point-remove" @click="removePoint(index)">削除</button>
        </div>
      </div>
      <button class="cc-point-add" @click="addPoint()">+ ポイントを追加</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RoleplayDesign } from '~/types/roleplay'

const design = ref<RoleplayDesign>({
  situation: '',
  opponentSetting: '',
  missions: {
    required: [''],
    scoring: [''],
    failure: ['']
  },
  points: [{
    question: '',
    criteria: '',
    example: ''
  }]
})

const addMissionItem = (type: 'required' | 'scoring' | 'failure') => {
  design.value.missions[type].push('')
}

const removeMissionItem = (type: 'required' | 'scoring' | 'failure', index: number) => {
  design.value.missions[type].splice(index, 1)
}

const addPoint = () => {
  design.value.points.push({
    question: '',
    criteria: '',
    example: ''
  })
}

const removePoint = (index: number) => {
  design.value.points.splice(index, 1)
}

// データをグローバルに公開（他のコンポーネントからアクセス可能にする）
defineExpose({ design })
</script>
