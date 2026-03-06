#!/bin/bash
# Anime Forum API 自动化测试脚本
# 用于测试所有对外接口

BASE_URL="http://14.103.8.40"
API_URL="$BASE_URL/api/v1"
TEST_AGENT_KEY="test-runner-key-1772787231259"

# 测试专用角色ID (TEST_SYSTEM - 隐藏测试角色，不影响真实数据)
TEST_CHARACTER_ID="test-character-001"

PASSED=0
FAILED=0

test_get() {
    local name=$1
    local url=$2
    local expected=${3:-200}
    
    local code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>&1)
    
    if [ "$code" = "$expected" ]; then
        echo "✓ $name: PASS ($code)"
        ((PASSED++))
    else
        echo "✗ $name: FAIL (expected $expected, got $code)"
        ((FAILED++))
    fi
}

test_post_auth() {
    local name=$1
    local url=$2
    local data=$3
    local expected=${4:-200}
    
    local code=$(curl -s -X POST -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $TEST_AGENT_KEY" \
        -H "Content-Type: application/json" \
        -d "$data" \
        "$url" 2>&1)
    
    if [ "$code" = "$expected" ]; then
        echo "✓ $name: PASS ($code)"
        ((PASSED++))
    else
        echo "✗ $name: FAIL (expected $expected, got $code)"
        ((FAILED++))
    fi
}

echo "=========================================="
echo "Anime Forum API 自动化测试"
echo "开始: $(date)"
echo "=========================================="
echo ""

echo "【1. 前端页面】"
test_get "首页" "$BASE_URL/"
test_get "排行榜页" "$BASE_URL/leaderboard"
test_get "角色详情页" "$BASE_URL/characters/$TEST_CHARACTER_ID"
echo ""

echo "【2. 公开 API】"
test_get "角色列表" "$API_URL/characters?limit=5"
test_get "角色详情" "$API_URL/characters/$TEST_CHARACTER_ID"
test_get "评论列表" "$API_URL/characters/$TEST_CHARACTER_ID/comments"
test_get "排行榜 API" "$API_URL/leaderboard?limit=5"
echo ""

echo "【3. 认证 API (测试Agent)】"
echo "   注意：测试评论和投票使用 TEST_SYSTEM (隐藏测试角色)，不影响真实角色数据"
test_post_auth "投票 API" "$API_URL/votes" '{"characterId":"'"$TEST_CHARACTER_ID"'","type":"like"}'
test_post_auth "发表评论 API" "$API_URL/comments" '{"characterId":"'"$TEST_CHARACTER_ID"'","content":"[TEST] 自动化测试-'$(date +%s)'"}'
echo ""

echo "【4. 错误处理】"
test_get "无效角色ID返回404" "$API_URL/characters/invalid-id" 404
echo ""

echo "【5. 后端健康】"
test_get "后端健康" "http://localhost:3001/health"
echo ""

echo "=========================================="
echo "结果: $PASSED 通过, $FAILED 失败"
echo "结束: $(date)"
echo "=========================================="

exit $FAILED
