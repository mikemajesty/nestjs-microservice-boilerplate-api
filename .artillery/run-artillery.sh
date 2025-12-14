#!/bin/bash

set -e

# Color definitions
BOLD="\033[1m"
RESET="\033[0m"
RED="\033[31m"
GREEN="\033[32m"
YELLOW="\033[33m"
BLUE="\033[34m"
PURPLE="\033[35m"
CYAN="\033[36m"
MAGENTA="\033[35m"

# Global variables
OUTPUT_FILE=".artillery/OUTPUT.md"
ENVIRONMENT=""
TEST_OPTION=""

load_env_variables() {
    if [ -f ".env" ]; then
        export $(grep -v '^#' .env | grep -E '^ARTILLERY_(TARGET|ENV|TEST_)' | xargs)
    fi
}

show_help() {
    echo "Artillery Load Testing Runner"
    echo "Documentation: https://artillery.io/docs"
    echo ""
    echo "Usage: $0 [environment] [options]"
    echo ""
    echo "Available environments:"
    echo "  local      - Local development testing (default)"
    echo "  dev        - Development environment"
    echo "  preprod    - Pre-production testing"
    echo "  prod       - Production testing"
    echo ""
    echo "Test options:"
    echo "  --quick    - Quick test (30s)"
    echo "  --smoke    - Smoke test (10s, 1 user)"
    echo ""
    echo "Environment can also be set via ARTILLERY_ENV in .env"
    echo ""
    echo "Examples:"
    echo "  $0 local"
    echo "  $0 prod --quick"
    echo "  $0 --smoke"
}

while [[ $# -gt 0 ]]; do
    case $1 in
        local|dev|preprod|prod)
            ENVIRONMENT="$1"
            shift
            ;;
        --quick)
            TEST_OPTION="quick"
            shift
            ;;
        --smoke)
            TEST_OPTION="smoke"
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "❌ Unknown argument: $1"
            show_help
            exit 1
            ;;
    esac
done

load_env_variables

if [ -z "$ENVIRONMENT" ]; then
    ENVIRONMENT="${ARTILLERY_ENV:-local}"
fi

if [[ ! "$ENVIRONMENT" =~ ^(local|dev|preprod|prod)$ ]]; then
    echo "❌ Invalid environment: $ENVIRONMENT"
    show_help
    exit 1
fi

setup_config_variables() {
    local config_file="./.artillery/config/${ENVIRONMENT}.mjs"
    
    if [ ! -f "$config_file" ]; then
        echo "❌ Configuration file not found: $config_file"
        exit 1
    fi

    local config_data=$(node --input-type=module -e "
        const config = (await import('$config_file')).default;
        console.log(JSON.stringify(config));
    ")

    export ARTILLERY_SCENARIO_NAME=$(echo "$config_data" | node -pe "JSON.parse(process.argv[1]).scenarioName" "$config_data")
    export ARTILLERY_THINK_TIME=$(echo "$config_data" | node -pe "JSON.parse(process.argv[1]).thinkTime" "$config_data")
    
    case $TEST_OPTION in
        quick)
            export ARTILLERY_PHASES="phases:
  - duration: 30
    arrivalRate: 10"
            ;;
        smoke)
            export ARTILLERY_PHASES="phases:
  - duration: 10
    arrivalRate: 1"
            ;;
        *)
            export ARTILLERY_PHASES=$(echo "$config_data" | node -pe "
                const config = JSON.parse(process.argv[1]);
                let output = 'phases:';
                config.phases.forEach(phase => {
                    output += '\\n  - duration: ' + phase.duration;
                    output += '\\n    arrivalRate: ' + phase.arrivalRate;
                });
                output;
            " "$config_data")
            ;;
    esac
}

echo "🎯 Running Artillery Load Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Environment: $ENVIRONMENT"
echo "Target: $ARTILLERY_TARGET"
if [ -n "$TEST_OPTION" ]; then
    echo "Test option: $TEST_OPTION"
fi
echo "Config file: .artillery/config/$ENVIRONMENT.mjs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

export ARTILLERY_ENV="$ENVIRONMENT"

setup_config_variables
# Function to perform health check with phase tracking
perform_health_check() {
    local target_url="$1"
    local phase_name="${2:-Post-Test}"
    local health_url="${target_url}/health"
    local max_attempts=3
    local base_delay=0.5
    
    echo -e "\n${BOLD}🩺 Health Check: $phase_name${RESET}"
    echo -e "${CYAN}┌─────────────────────────────────────────────────────┐${RESET}"
    echo -e "${CYAN}│${RESET} ${YELLOW}Endpoint:${RESET} ${health_url}                  ${CYAN}│${RESET}"
    echo -e "${CYAN}│${RESET} ${BLUE}Time:${RESET} $(date '+%Y-%m-%d %H:%M:%S')                         ${CYAN}│${RESET}"
    echo -e "${CYAN}│${RESET} ${PURPLE}Phase:${RESET} $phase_name                               ${CYAN}│${RESET}"
    echo -e "${CYAN}│${RESET} ${GREEN}Retries:${RESET} Up to $max_attempts attempts                      ${CYAN}│${RESET}"
    echo -e "${CYAN}└─────────────────────────────────────────────────────┘${RESET}"
    
    local health_response
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo -e "\n${YELLOW}🔄 Attempt $attempt/$max_attempts...${RESET}"
        
        if health_response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\nTIME_TOTAL:%{time_total}" --max-time 10 --connect-timeout 5 "$health_url" 2>/dev/null); then
            local body=$(echo "$health_response" | sed '/^HTTP_STATUS:/,$d')
            local status_code=$(echo "$health_response" | grep "HTTP_STATUS:" | cut -d: -f2)
            local response_time=$(echo "$health_response" | grep "TIME_TOTAL:" | cut -d: -f2)
            
            # Success codes
            if [[ "$status_code" =~ ^20[0-9]$ ]]; then
                echo -e "\n${GREEN}✅ Health check completed successfully${RESET}"
                echo -e "${BOLD}Status Code:${RESET} $status_code"
                echo -e "${BOLD}Response Time:${RESET} ${response_time}s"
                if [ $attempt -gt 1 ]; then
                    echo -e "${BOLD}Attempts:${RESET} $attempt/$max_attempts"
                fi
                
                # Add to OUTPUT.md
                {
                    echo ""
                    echo "## 🩺 Health Check: $phase_name"
                    echo ""
                    echo "**Timestamp:** $(date '+%Y-%m-%d %H:%M:%S')"
                    echo "**Endpoint:** \`$health_url\`"
                    echo "**Status Code:** ✅ $status_code"
                    echo "**Response Time:** ${response_time}s"
                    echo "**Attempts:** $attempt/$max_attempts"
                    echo ""
                    echo "### Response Body"
                    echo "\`\`\`json"
                    echo "$body" | jq . 2>/dev/null || echo "$body"
                    echo "\`\`\`"
                } >> "$OUTPUT_FILE"
                
                echo -e "\n${BLUE}📄 Health check results added to OUTPUT.md${RESET}"
                return 0
            else
                echo -e "${YELLOW}⚠️  Status $status_code (attempt $attempt/$max_attempts)${RESET}"
            fi
        else
            echo -e "${YELLOW}⚠️  Connection failed (attempt $attempt/$max_attempts)${RESET}"
        fi
        
        # If not the last attempt, wait with exponential backoff
        if [ $attempt -lt $max_attempts ]; then
            # Simple exponential backoff without bc dependency
            case $attempt in
                1) delay=1 ;;
                2) delay=2 ;;
                *) delay=3 ;;
            esac
            
            # Add small random jitter (0-1 second)
            local jitter=$((RANDOM % 1000))
            local jitter_sec=$((jitter / 1000))
            local total_delay=$((delay + jitter_sec))
            
            echo -e "${BLUE}⏳ Waiting ${total_delay}s before retry...${RESET}"
            sleep $total_delay
        fi
        
        attempt=$((attempt + 1))
    done
    
    echo -e "\n${RED}❌ Health check failed after $max_attempts attempts${RESET}"
    
    # Add failure to OUTPUT.md
    {
        echo ""
        echo "## 🩺 Health Check: $phase_name"
        echo ""
        echo "**Timestamp:** $(date '+%Y-%m-%d %H:%M:%S')"
        echo "**Endpoint:** \`$health_url\`"
        echo "**Status:** ❌ FAILED after $max_attempts attempts"
        echo "**Error:** Could not get successful response from health endpoint"
    } >> "$OUTPUT_FILE"
    return 1
}

# Function to monitor Artillery phases and perform health checks
monitor_artillery_phases() {
    local artillery_pid="$1"
    local target_url="$2"
    local config_file="./.artillery/config/${ENVIRONMENT}.mjs"
    
    # Read phase configurations from config
    local phase_durations
    local phase_rates
    if [ -f "$config_file" ]; then
        phase_durations=$(node --input-type=module -e "
            const config = (await import('$config_file')).default;
            const durations = config.phases.map(phase => phase.duration);
            console.log(durations.join(','));
        " 2>/dev/null || echo "")
        
        phase_rates=$(node --input-type=module -e "
            const config = (await import('$config_file')).default;
            const rates = config.phases.map(phase => phase.arrivalRate);
            console.log(rates.join(','));
        " 2>/dev/null || echo "")
    fi
    
    if [ -n "$phase_durations" ] && [ -n "$phase_rates" ]; then
        IFS=',' read -ra DURATIONS <<< "$phase_durations"
        IFS=',' read -ra RATES <<< "$phase_rates"
        
        local total_phases=${#DURATIONS[@]}
        local current_phase=1
        local test_start_time=$(date +%s)
        
        echo -e "\n${CYAN}🎯 Starting Artillery Phase Monitoring${RESET}"
        echo -e "${BLUE}┌────────────────────────────────────────────────────────────┐${RESET}"
        echo -e "${BLUE}│${RESET} ${BOLD}Phase Overview${RESET}                                    ${BLUE}│${RESET}"
        for i in "${!DURATIONS[@]}"; do
            local phase_num=$((i + 1))
            local estimated_users=$((${DURATIONS[i]} * ${RATES[i]}))
            printf "${BLUE}│${RESET} ${YELLOW}Phase $phase_num:${RESET} %3ds × %2d users/s → ~%d users%*s${BLUE}│${RESET}\n" \
                "${DURATIONS[i]}" "${RATES[i]}" "$estimated_users" \
                $((15 - ${#estimated_users})) ""
        done
        echo -e "${BLUE}└────────────────────────────────────────────────────────────┘${RESET}"
        echo ""
        
        for i in "${!DURATIONS[@]}"; do
            local phase_duration=${DURATIONS[i]}
            local phase_rate=${RATES[i]}
            local phase_num=$((i + 1))
            local estimated_users=$((phase_duration * phase_rate))
            
            echo -e "${YELLOW}🚀 Phase $phase_num/${total_phases}: ${BOLD}${phase_duration}s × ${phase_rate} users/s${RESET} (→ ~${estimated_users} users)"
            
            # Progress bar for current phase
            local progress_chars=50
            local step_time=$((phase_duration / progress_chars))
            if [ $step_time -lt 1 ]; then step_time=1; fi
            
            for ((progress = 0; progress <= progress_chars; progress++)); do
                # Check if Artillery is still running
                if ! kill -0 "$artillery_pid" 2>/dev/null; then
                    echo -e "\n${RED}Artillery process ended unexpectedly${RESET}"
                    return
                fi
                
                # Calculate percentage
                local percentage=$((progress * 100 / progress_chars))
                local filled=$((progress * 40 / progress_chars))
                local empty=$((40 - filled))
                
                # Build progress bar
                local bar=""
                for ((j = 0; j < filled; j++)); do bar+="█"; done
                for ((j = 0; j < empty; j++)); do bar+="░"; done
                
                # Calculate elapsed time
                local current_time=$(date +%s)
                local elapsed=$((current_time - test_start_time))
                local phase_elapsed=$((elapsed % phase_duration))
                if [ $progress -eq $progress_chars ]; then phase_elapsed=$phase_duration; fi
                
                # Display progress
                printf "\r${BLUE}│${RESET} ${GREEN}$bar${RESET} ${BOLD}%3d%%${RESET} ${BLUE}│${RESET} %3ds/%3ds ${BLUE}│${RESET} Phase $phase_num Rate: ${YELLOW}%d users/s${RESET}" \
                    "$percentage" "$phase_elapsed" "$phase_duration" "$phase_rate"
                
                if [ $progress -lt $progress_chars ]; then
                    sleep $step_time
                fi
            done
            
            echo -e "\n${GREEN}✅ Phase $phase_num completed${RESET}"
            
            # Health check at end of phase (except last phase)
            if [ $phase_num -lt $total_phases ]; then
                echo -e "${CYAN}🔍 Performing inter-phase health check...${RESET}"
                perform_health_check "$target_url" "Phase $phase_num Completion"
                echo ""
            fi
        done
        
        echo -e "\n${GREEN}🎉 All phases completed! Waiting for final results...${RESET}"
    fi
}
# Function to extract API performance data from Artillery output
extract_api_performance() {
    local artillery_output="$1"
    
    # Extract metrics from Summary report section (more reliable)
    local summary_section=$(echo "$artillery_output" | sed -n '/Summary report/,$p')
    
    # Extract basic metrics from Artillery output using Summary report
    local total_requests=$(echo "$summary_section" | grep "http.requests:" | head -1 | grep -o '[0-9]\+$' || echo "0")
    local errors_etimedout=$(echo "$summary_section" | grep "errors.ETIMEDOUT:" | head -1 | grep -o '[0-9]\+$' || echo "0")
    local failed_vusers=$(echo "$summary_section" | grep "vusers.failed:" | head -1 | grep -o '[0-9]\+$' || echo "0")
    
    # Use the higher value between ETIMEDOUT errors and failed vusers
    local errors=$errors_etimedout
    if [ "$failed_vusers" -gt "$errors_etimedout" ]; then
        errors=$failed_vusers
    fi
    
    local success_rate=100
    local error_rate=0
    
    if [ "$total_requests" -gt 0 ]; then
        success_rate=$(( (total_requests - errors) * 100 / total_requests ))
        error_rate=$((100 - success_rate))
    fi
    
    # Read actual arrivalRate values from config file
    local config_file="./.artillery/config/${ENVIRONMENT}.mjs"
    local max_arrival_rate="Unknown"
    
    if [ -f "$config_file" ]; then
        # Extract the highest arrivalRate from the config phases
        max_arrival_rate=$(node --input-type=module -e "
            const config = (await import('$config_file')).default;
            const rates = config.phases.map(phase => phase.arrivalRate);
            const maxRate = Math.max(...rates);
            console.log(maxRate);
        " 2>/dev/null || echo "Unknown")
    fi
    
    # Analyze saturation point based on actual execution
    local saturation_point="Not detected"
    
    if [ "$max_arrival_rate" != "Unknown" ] && [ "$max_arrival_rate" != "" ]; then
        if [ "$error_rate" -eq 0 ]; then
            saturation_point=">$max_arrival_rate users/s (no saturation found)"
        elif [ "$error_rate" -lt 5 ]; then
            # Minor errors - saturation point close to max rate
            local estimated_limit=$((max_arrival_rate * 95 / 100))
            saturation_point="~$estimated_limit-$max_arrival_rate users/s (saturation detected)"
        elif [ "$error_rate" -lt 25 ]; then
            # Moderate errors - saturation point below max rate
            local estimated_limit=$((max_arrival_rate * 75 / 100))
            saturation_point="~$estimated_limit users/s (limit exceeded)"
        elif [ "$error_rate" -lt 50 ]; then
            # High errors - significant saturation
            local estimated_limit=$((max_arrival_rate * 50 / 100))
            saturation_point="~$estimated_limit users/s (heavily saturated)"
        else
            # Very high error rate - severe overload
            local estimated_limit=$((max_arrival_rate * 30 / 100))
            saturation_point="~$estimated_limit users/s (SEVERE OVERLOAD)"
        fi
    else
        # Fallback if config can't be read
        if [ "$error_rate" -eq 0 ]; then
            saturation_point="No saturation detected in current test"
        else
            saturation_point="Saturation detected - reduce load"
        fi
    fi
    
    # Set status based on error detection
    if [ "$error_rate" -eq 0 ]; then
        API_LIMIT_STATUS="✅ No errors detected - API stable"
    elif [ "$error_rate" -lt 5 ]; then
        API_LIMIT_STATUS="⚠️ Saturation point reached"
    elif [ "$error_rate" -lt 25 ]; then
        API_LIMIT_STATUS="🔶 API limit exceeded"
    elif [ "$error_rate" -lt 50 ]; then
        API_LIMIT_STATUS="🚨 API heavily overloaded"
    else
        API_LIMIT_STATUS="💥 CRITICAL OVERLOAD - API failing"
    fi
    
    API_MAX_RPS="$saturation_point"
    API_ERROR_RATE="${error_rate}% ($errors errors / $total_requests requests)"
    
    # Calculate capacity levels based on actual limits
    if [ "$max_arrival_rate" != "Unknown" ] && [ "$max_arrival_rate" != "" ]; then
        # Based on error rate, estimate the actual sustainable limit
        if [ "$error_rate" -gt 40 ]; then
            # High error rate - actual limit is much lower
            local actual_limit=$((max_arrival_rate * 35 / 100))
        elif [ "$error_rate" -gt 20 ]; then
            # Moderate error rate - actual limit is lower
            local actual_limit=$((max_arrival_rate * 50 / 100))
        elif [ "$error_rate" -gt 5 ]; then
            # Low error rate - close to limit
            local actual_limit=$((max_arrival_rate * 80 / 100))
        else
            # No errors - can handle more
            local actual_limit=$max_arrival_rate
        fi
        
        # Calculate 4 capacity levels
        API_CONSERVATIVE=$((actual_limit * 60 / 100))
        API_RECOMMENDED=$((actual_limit * 75 / 100))
        API_NEAR_LIMIT=$((actual_limit * 90 / 100))
        API_MAX_NO_ERROR=$actual_limit
    else
        # Fallback values
        API_CONSERVATIVE=15
        API_RECOMMENDED=20
        API_NEAR_LIMIT=25
        API_MAX_NO_ERROR=30
    fi
}

show_test_summary() {
    # Colors
    local GREEN='\033[32m'
    local YELLOW='\033[33m'
    local BLUE='\033[34m'
    local MAGENTA='\033[35m'
    local CYAN='\033[36m'
    local RED='\033[31m'
    local BOLD='\033[1m'
    local RESET='\033[0m'
    
    if [ "$TEST_OPTION" = "smoke" ]; then
        echo -e "${BOLD}📋 Test Summary${RESET}"
        echo -e "${CYAN}┌─────────────────────────────────────────────────────┐${RESET}"
        echo -e "${CYAN}│${RESET} ${YELLOW}💨 SMOKE TEST${RESET} - ${GREEN}Quick Validation${RESET}             ${CYAN}│${RESET}"
        echo -e "${CYAN}├─────────────────────────────────────────────────────┤${RESET}"
        echo -e "${CYAN}│${RESET} ${MAGENTA}⚡ Warm-up:${RESET} ${BLUE}10s${RESET} × ${GREEN}1 user/s${RESET} → ${BOLD}~10 total users${RESET}  ${CYAN}│${RESET}"
        echo -e "${CYAN}│${RESET} ${YELLOW}🎯 Duration:${RESET} ${BOLD}10 seconds${RESET} of minimal load testing    ${CYAN}│${RESET}"
        echo -e "${CYAN}└─────────────────────────────────────────────────────┘${RESET}"
    elif [ "$TEST_OPTION" = "quick" ]; then
        echo -e "${BOLD}📋 Test Summary${RESET}"
        echo -e "${CYAN}┌─────────────────────────────────────────────────────┐${RESET}"
        echo -e "${CYAN}│${RESET} ${YELLOW}⚡ QUICK TEST${RESET} - ${GREEN}Rapid Performance Check${RESET}      ${CYAN}│${RESET}"
        echo -e "${CYAN}├─────────────────────────────────────────────────────┤${RESET}"
        echo -e "${CYAN}│${RESET} ${MAGENTA}🚀 Burst Load:${RESET} ${BLUE}30s${RESET} × ${GREEN}10 users/s${RESET} → ${BOLD}~300 users${RESET} ${CYAN}│${RESET}"
        echo -e "${CYAN}│${RESET} ${YELLOW}🎯 Duration:${RESET} ${BOLD}30 seconds${RESET} of sustained testing      ${CYAN}│${RESET}"
        echo -e "${CYAN}└─────────────────────────────────────────────────────┘${RESET}"
    else
        case $ENVIRONMENT in
            local)
                echo -e "${BOLD}📋 Test Summary${RESET}"
                echo -e "${CYAN}┌──────────────────────────────────────────────────────────┐${RESET}"
                echo -e "${CYAN}│${RESET} ${RED}🏠 LOCAL${RESET} - ${YELLOW}⚠️ HIGH STRESS TESTING ⚠️${RESET}            ${CYAN}│${RESET}"
                echo -e "${CYAN}├──────────────────────────────────────────────────────────┤${RESET}"
                echo -e "${CYAN}│${RESET} ${MAGENTA}📈 Warm-up:${RESET} ${BLUE}120s${RESET} × ${GREEN}25 users/s${RESET} → ${BOLD}~3.000 users${RESET}    ${CYAN}│${RESET}"
                echo -e "${CYAN}│${RESET} ${RED}🔥 Peak Load:${RESET} ${BLUE}300s${RESET} × ${GREEN}50 users/s${RESET} → ${BOLD}~15.000 users${RESET} ${CYAN}│${RESET}"
                echo -e "${CYAN}│${RESET} ${YELLOW}🚨 STRESS:${RESET} ${BLUE}180s${RESET} × ${RED}75 users/s${RESET} → ${BOLD}~13.500 users${RESET}   ${CYAN}│${RESET}"
                echo -e "${CYAN}│${RESET} ${MAGENTA}📉 Cool-down:${RESET} ${BLUE}120s${RESET} × ${GREEN}25 users/s${RESET} → ${BOLD}~3.000 users${RESET}   ${CYAN}│${RESET}"
                echo -e "${CYAN}├──────────────────────────────────────────────────────────┤${RESET}"
                echo -e "${CYAN}│${RESET} ${YELLOW}🎯 Total Impact:${RESET} ${BOLD}~34.500 users${RESET} over ${BLUE}12 minutes${RESET}      ${CYAN}│${RESET}"
                echo -e "${CYAN}│${RESET} ${BLUE}🕒 Start Time:${RESET} ${BOLD}$(date '+%Y-%m-%d %H:%M:%S')${RESET}                    ${CYAN}│${RESET}"
                echo -e "${CYAN}│${RESET} ${RED}⚠️ WARNING:${RESET} Monitor system resources closely!      ${CYAN}│${RESET}"
                if [[ -n "$API_LIMIT_STATUS" ]]; then
                    echo -e "${CYAN}├──────────────────────────────────────────────────────────┤${RESET}"
                    echo -e "${CYAN}│${RESET} ${YELLOW}📊 API Limit Analysis:${RESET}                            ${CYAN}│${RESET}"
                    echo -e "${CYAN}│${RESET} ${GREEN}• Status:${RESET} $API_LIMIT_STATUS                     ${CYAN}│${RESET}"
                    echo -e "${CYAN}│${RESET} ${BLUE}• Max Sustainable:${RESET} $API_MAX_RPS                  ${CYAN}│${RESET}"
                    echo -e "${CYAN}│${RESET} ${RED}• Error Rate:${RESET} $API_ERROR_RATE                      ${CYAN}│${RESET}"
                fi
                echo -e "${CYAN}└──────────────────────────────────────────────────────────┘${RESET}"
                ;;
            dev)
                echo -e "${BOLD}📋 Test Summary${RESET}"
                echo -e "${CYAN}┌──────────────────────────────────────────────────────────┐${RESET}"
                echo -e "${CYAN}│${RESET} ${YELLOW}🔧 DEV${RESET} - ${GREEN}Development Environment Load Test${RESET}       ${CYAN}│${RESET}"
                echo -e "${CYAN}├──────────────────────────────────────────────────────────┤${RESET}"
                echo -e "${CYAN}│${RESET} ${MAGENTA}📈 Ramp-up:${RESET} ${BLUE}120s${RESET} × ${GREEN}10 users/s${RESET} → ${BOLD}~1.200 users${RESET}    ${CYAN}│${RESET}"
                echo -e "${CYAN}│${RESET} ${RED}🔥 Peak Load:${RESET} ${BLUE}300s${RESET} × ${GREEN}20 users/s${RESET} → ${BOLD}~6.000 users${RESET}   ${CYAN}│${RESET}"
                echo -e "${CYAN}│${RESET} ${MAGENTA}📉 Cool-down:${RESET} ${BLUE}120s${RESET} × ${GREEN}10 users/s${RESET} → ${BOLD}~1.200 users${RESET}   ${CYAN}│${RESET}"
                echo -e "${CYAN}├──────────────────────────────────────────────────────────┤${RESET}"
                echo -e "${CYAN}│${RESET} ${YELLOW}🎯 Total Impact:${RESET} ${BOLD}~8.400 users${RESET} over ${BLUE}9 minutes${RESET}        ${CYAN}│${RESET}"
                echo -e "${CYAN}└──────────────────────────────────────────────────────────┘${RESET}"
                ;;
            preprod)
                echo -e "${BOLD}📋 Test Summary${RESET}"
                echo -e "${CYAN}┌──────────────────────────────────────────────────────────┐${RESET}"
                echo -e "${CYAN}│${RESET} ${YELLOW}🚧 PREPROD${RESET} - ${GREEN}Pre-Production Stress Testing${RESET}      ${CYAN}│${RESET}"
                echo -e "${CYAN}├──────────────────────────────────────────────────────────┤${RESET}"
                echo -e "${CYAN}│${RESET} ${MAGENTA}📈 Ramp-up:${RESET} ${BLUE}180s${RESET} × ${GREEN}15 users/s${RESET} → ${BOLD}~2.700 users${RESET}    ${CYAN}│${RESET}"
                echo -e "${CYAN}│${RESET} ${RED}🔥 Peak Load:${RESET} ${BLUE}360s${RESET} × ${GREEN}30 users/s${RESET} → ${BOLD}~10.800 users${RESET}  ${CYAN}│${RESET}"
                echo -e "${CYAN}│${RESET} ${MAGENTA}📉 Cool-down:${RESET} ${BLUE}180s${RESET} × ${GREEN}10 users/s${RESET} → ${BOLD}~1.800 users${RESET}   ${CYAN}│${RESET}"
                echo -e "${CYAN}├──────────────────────────────────────────────────────────┤${RESET}"
                echo -e "${CYAN}│${RESET} ${YELLOW}🎯 Total Impact:${RESET} ${BOLD}~15.300 users${RESET} over ${BLUE}12 minutes${RESET}       ${CYAN}│${RESET}"
                echo -e "${CYAN}└──────────────────────────────────────────────────────────┘${RESET}"
                ;;
            prod)
                echo -e "${BOLD}📋 Test Summary${RESET}"
                echo -e "${CYAN}┌──────────────────────────────────────────────────────────┐${RESET}"
                echo -e "${CYAN}│${RESET} ${RED}🏭 PRODUCTION${RESET} - ${GREEN}High-Scale Load Testing${RESET}          ${CYAN}│${RESET}"
                echo -e "${CYAN}├──────────────────────────────────────────────────────────┤${RESET}"
                echo -e "${CYAN}│${RESET} ${MAGENTA}📈 Ramp-up:${RESET} ${BLUE}300s${RESET} × ${GREEN}50 users/s${RESET} → ${BOLD}~15.000 users${RESET}   ${CYAN}│${RESET}"
                echo -e "${CYAN}│${RESET} ${RED}🔥 Peak Load:${RESET} ${BLUE}600s${RESET} × ${GREEN}100 users/s${RESET} → ${BOLD}~60.000 users${RESET} ${CYAN}│${RESET}"
                echo -e "${CYAN}│${RESET} ${MAGENTA}📉 Cool-down:${RESET} ${BLUE}300s${RESET} × ${GREEN}25 users/s${RESET} → ${BOLD}~7.500 users${RESET}   ${CYAN}│${RESET}"
                echo -e "${CYAN}├──────────────────────────────────────────────────────────┤${RESET}"
                echo -e "${CYAN}│${RESET} ${YELLOW}🎯 Total Impact:${RESET} ${BOLD}~82.500 users${RESET} over ${BLUE}20 minutes${RESET}      ${CYAN}│${RESET}"
                echo -e "${CYAN}└──────────────────────────────────────────────────────────┘${RESET}"
                ;;
        esac
    fi
    echo ""
}

show_test_summary

envsubst < .artillery/template.yaml > .artillery/output.yaml

echo "🚀 Starting Artillery test execution..."
echo ""

# Store start time
START_TIME=$(date +%s)

# Run Artillery in background and capture PID for monitoring
npx artillery run .artillery/output.yaml > artillery_temp.log 2>&1 &
ARTILLERY_PID=$!

# Start phase monitoring in background
monitor_artillery_phases "$ARTILLERY_PID" "$ARTILLERY_TARGET" &
MONITOR_PID=$!

# Wait for Artillery to complete and capture output
wait "$ARTILLERY_PID"
artillery_exit_code=$?

# Stop phase monitoring
kill "$MONITOR_PID" 2>/dev/null || true

# Read the output from temp file
artillery_output=$(cat artillery_temp.log)
rm -f artillery_temp.log

echo "$artillery_output"

# Extract and display simplified results
# Function to generate OUTPUT.md
generate_output_md() {
    local total_requests=$1
    local status_200=$2
    local status_201=$3
    local failures=$4
    local response_min=$5
    local response_max=$6
    local response_mean=$7
    local total_time=$8
    local success_rate=$9
    
    local timestamp=$(date '+%B %d, %Y at %H:%M:%S')
    local test_status="✅ ALL TESTS PASSED"
    
    if [ "$failures" != "0" ]; then
        test_status="❌ SOME TESTS FAILED"
    elif [ "$total_requests" = "0" ]; then
        test_status="⚠️ NO DATA COLLECTED"
    fi
    
    # Create OUTPUT.md with beautiful formatting
    cat > .artillery/OUTPUT.md << EOF
# 🎯 Artillery Load Test Results

**Generated:** ${timestamp}  
**Environment:** ${ENVIRONMENT}  
**Target:** ${ARTILLERY_TARGET}  
**Test Option:** ${TEST_OPTION:-standard}
### 🎯 API Performance Limits

${API_LIMIT_STATUS:+**Status:** $API_LIMIT_STATUS  }
${API_MAX_RPS:+**Max Sustainable Load:** $API_MAX_RPS  }
${API_ERROR_RATE:+**Error Rate:** $API_ERROR_RATE  }

### 📊 API Capacity Levels

| Level | Users/Second | Usage | Description |
|-------|-------------|--------|-------------|
| 🟢 **Conservative** | \`${API_CONSERVATIVE:-N/A} users/s\` | Daily Operations | Safe for continuous use |
| 🔵 **Recommended** | \`${API_RECOMMENDED:-N/A} users/s\` | Normal Peak | Optimal performance zone |
| 🟡 **Near Limit** | \`${API_NEAR_LIMIT:-N/A} users/s\` | High Traffic | Monitor closely, temporary spikes |
| 🔴 **Max No Error** | \`${API_MAX_NO_ERROR:-N/A} users/s\` | Emergency | Absolute limit before errors |

---

## � Test Configuration

### Environment Details
- **Environment:** ${ENVIRONMENT}
- **Target URL:** ${ARTILLERY_TARGET}
- **Test Type:** ${TEST_OPTION:-standard}
- **Config File:** \`.artillery/config/${ENVIRONMENT}.mjs\`

### Test Phases
EOF

    # Add phase information based on test option
    case "$TEST_OPTION" in
        smoke)
            cat >> .artillery/OUTPUT.md << EOF
- **Phase 1:** 10s × 1 user/s → ~10 total users
- **Duration:** 10 seconds of minimal load testing
EOF
            ;;
        quick)
            cat >> .artillery/OUTPUT.md << EOF
- **Phase 1:** 30s × 10 users/s → ~300 total users
- **Duration:** 30 seconds of sustained testing
EOF
            ;;
        *)
            case "$ENVIRONMENT" in
                local|dev)
                    cat >> .artillery/OUTPUT.md << EOF
- **Phase 1 (Ramp-up):** 60s × 5 users/s → ~300 users
- **Phase 2 (Peak Load):** 120s × 10 users/s → ~1,200 users
- **Phase 3 (Cool-down):** 60s × 5 users/s → ~300 users
- **Total Impact:** ~1,800 users over 4 minutes
EOF
                    ;;
                preprod|prod)
                    cat >> .artillery/OUTPUT.md << EOF
- **Phase 1 (Ramp-up):** 300s × 2 users/s → ~600 users
- **Phase 2 (Peak Load):** 600s × 5 users/s → ~3,000 users
- **Phase 3 (Cool-down):** 300s × 2 users/s → ~600 users
- **Total Impact:** ~4,200 users over 20 minutes
EOF
                    ;;
            esac
            ;;
    esac

    cat >> .artillery/OUTPUT.md << EOF

---

## 📊 Performance Summary

| Metric | Value |
|--------|--------|
| 📈 **Total Requests** | \`${total_requests}\` |
| ✅ **Successful (200)** | \`${status_200}\` |
| 🆕 **Created (201)** | \`${status_201}\` |
| ❌ **Failed Requests** | \`${failures}\` |
| 📊 **Success Rate** | \`${success_rate}%\` |
| 🏃 **Fastest Response** | \`${response_min}ms\` |
| 🐌 **Slowest Response** | \`${response_max}ms\` |
| 📊 **Average Response** | \`${response_mean}ms\` |
| ⏱️ **Total Duration** | \`${total_time}\` |
| 🎉 **Status** | ${test_status} |
EOF

    cat >> .artillery/OUTPUT.md << 'ARTILLERY_OUTPUT_END'

---

## 🔍 Full Artillery Output

```
ARTILLERY_OUTPUT_END

    # Add the artillery output safely, filtering out repetitive credential messages
    echo "$artillery_output" | grep -v "✅ Using credentials from .env for environment:" >> .artillery/OUTPUT.md
    
    cat >> .artillery/OUTPUT.md << 'ARTILLERY_FOOTER_END'
```

---

*Generated by Artillery Load Testing System*  
*Last updated: 
ARTILLERY_FOOTER_END
    echo "${timestamp}*" >> .artillery/OUTPUT.md

    echo ""
    echo -e "\033[32m📝 .artillery/OUTPUT.md generated successfully!\033[0m"
}

show_test_results() {
    local GREEN='\033[32m'
    local YELLOW='\033[33m'
    local BLUE='\033[34m'
    local RED='\033[31m'
    local CYAN='\033[36m'
    local BOLD='\033[1m'
    local RESET='\033[0m'
    
    # Extract metrics from Artillery output (from Summary report section)
    local summary_section=$(echo "$artillery_output" | sed -n '/Summary report/,$p')
    
    local total_requests=$(echo "$summary_section" | grep "http.requests:" | head -1 | grep -o '[0-9]\+$')
    local status_200=$(echo "$summary_section" | grep "http.codes.200:" | head -1 | grep -o '[0-9]\+$')
    local status_201=$(echo "$summary_section" | grep "http.codes.201:" | head -1 | grep -o '[0-9]\+$')
    local failures=$(echo "$summary_section" | grep "vusers.failed:" | head -1 | grep -o '[0-9]\+$')
    local response_min=$(echo "$summary_section" | grep "min:" | head -1 | grep -o '[0-9]\+$')
    local response_max=$(echo "$summary_section" | grep "max:" | head -1 | grep -o '[0-9]\+$')
    local response_mean=$(echo "$summary_section" | grep "mean:" | head -1 | grep -o '[0-9.]\+$')
    local total_time=$(echo "$artillery_output" | grep "Total time:" | sed 's/.*Total time: //')
    
    # Default values if not found
    total_requests=${total_requests:-0}
    status_200=${status_200:-0}
    status_201=${status_201:-0}
    failures=${failures:-0}
    response_min=${response_min:-0}
    response_max=${response_max:-0}
    response_mean=${response_mean:-0}
    total_time=${total_time:-"unknown duration"}
    
    # Calculate success rate
    local success_total=$((status_200 + status_201))
    local success_rate=0
    if [ "$total_requests" -gt 0 ]; then
        success_rate=$(( (success_total * 100) / total_requests ))
    fi
    
    echo ""
    echo -e "${BOLD}📊 Test Results Summary${RESET}"
    echo -e "${BLUE}┌──────────────────────────────────────────────────────────┐${RESET}"
    echo -e "${BLUE}│${RESET} ${YELLOW}🎯 PERFORMANCE METRICS${RESET}                              ${BLUE}│${RESET}"
    echo -e "${BLUE}├──────────────────────────────────────────────────────────┤${RESET}"
    echo -e "${BLUE}│${RESET} ${BOLD}📈 Total Requests:${RESET} ${GREEN}$total_requests${RESET}                          ${BLUE}│${RESET}"
    echo -e "${BLUE}│${RESET} ${BOLD}✅ Successful (200):${RESET} ${GREEN}$status_200${RESET}                        ${BLUE}│${RESET}"
    echo -e "${BLUE}│${RESET} ${BOLD}🆕 Created (201):${RESET} ${GREEN}$status_201${RESET}                           ${BLUE}│${RESET}"
    echo -e "${BLUE}│${RESET} ${BOLD}❌ Failed Requests:${RESET} ${RED}$failures${RESET}                           ${BLUE}│${RESET}"
    echo -e "${BLUE}│${RESET} ${BOLD}📊 Success Rate:${RESET} ${GREEN}${success_rate}%${RESET}                          ${BLUE}│${RESET}"
    echo -e "${BLUE}├──────────────────────────────────────────────────────────┤${RESET}"
    echo -e "${BLUE}│${RESET} ${YELLOW}⚡ RESPONSE TIME ANALYSIS${RESET}                          ${BLUE}│${RESET}"
    echo -e "${BLUE}│${RESET} ${BOLD}🏃 Fastest Response:${RESET} ${GREEN}${response_min}ms${RESET}                   ${BLUE}│${RESET}"
    echo -e "${BLUE}│${RESET} ${BOLD}🐌 Slowest Response:${RESET} ${YELLOW}${response_max}ms${RESET}                  ${BLUE}│${RESET}"
    echo -e "${BLUE}│${RESET} ${BOLD}📊 Average Response:${RESET} ${BLUE}${response_mean}ms${RESET}                   ${BLUE}│${RESET}"
    echo -e "${BLUE}├──────────────────────────────────────────────────────────┤${RESET}"
    echo -e "${BLUE}│${RESET} ${BOLD}⏱️ Total Duration:${RESET} ${CYAN}$total_time${RESET}                      ${BLUE}│${RESET}"
    
    # Test status
    if [ "$failures" = "0" ] && [ "$total_requests" != "0" ]; then
        echo -e "${BLUE}│${RESET} ${BOLD}🎉 Test Status:${RESET} ${GREEN}✅ ALL TESTS PASSED${RESET}               ${BLUE}│${RESET}"
    elif [ "$failures" != "0" ]; then
        echo -e "${BLUE}│${RESET} ${BOLD}⚠️ Test Status:${RESET} ${RED}❌ SOME TESTS FAILED${RESET}              ${BLUE}│${RESET}"
    else
        echo -e "${BLUE}│${RESET} ${BOLD}❓ Test Status:${RESET} ${YELLOW}⚠️ NO DATA COLLECTED${RESET}             ${BLUE}│${RESET}"
    fi
    
    # Show API limit analysis if available
    if [[ -n "$API_LIMIT_STATUS" ]]; then
        echo -e "${BLUE}├──────────────────────────────────────────────────────────┤${RESET}"
        echo -e "${BLUE}│${RESET} ${YELLOW}📊 API SATURATION ANALYSIS${RESET}                         ${BLUE}│${RESET}"
        echo -e "${BLUE}│${RESET} ${GREEN}• Status:${RESET} $API_LIMIT_STATUS                     ${BLUE}│${RESET}"
        echo -e "${BLUE}│${RESET} ${MAGENTA}• API Limit:${RESET} $API_MAX_RPS                  ${BLUE}│${RESET}"
        echo -e "${BLUE}│${RESET} ${RED}• Error Rate:${RESET} $API_ERROR_RATE                      ${BLUE}│${RESET}"
        echo -e "${BLUE}├──────────────────────────────────────────────────────────┤${RESET}"
        echo -e "${BLUE}│${RESET} ${YELLOW}🎯 API CAPACITY LEVELS (users/second)${RESET}             ${BLUE}│${RESET}"
        echo -e "${BLUE}│${RESET} ${GREEN}🟢 Conservative:${RESET} ${BOLD}$API_CONSERVATIVE users/s${RESET} (safe daily use)      ${BLUE}│${RESET}"
        echo -e "${BLUE}│${RESET} ${BLUE}🔵 Recommended:${RESET} ${BOLD}$API_RECOMMENDED users/s${RESET} (optimal performance)   ${BLUE}│${RESET}"
        echo -e "${BLUE}│${RESET} ${YELLOW}🟡 Near Limit:${RESET} ${BOLD}$API_NEAR_LIMIT users/s${RESET} (monitor closely)       ${BLUE}│${RESET}"
        echo -e "${BLUE}│${RESET} ${RED}🔴 Max No Error:${RESET} ${BOLD}$API_MAX_NO_ERROR users/s${RESET} (absolute limit)     ${BLUE}│${RESET}"
    fi
    
    echo -e "${BLUE}└──────────────────────────────────────────────────────────┘${RESET}"
    
    # Generate OUTPUT.md file
    generate_output_md "$total_requests" "$status_200" "$status_201" "$failures" "$response_min" "$response_max" "$response_mean" "$total_time" "$success_rate"
    echo ""
}

if [ $artillery_exit_code -eq 0 ]; then
    # Extract API performance data from Artillery output
    extract_api_performance "$artillery_output"
    
    show_test_results
    
    # Perform final health check
    echo -e "\n${CYAN}🔍 Performing final health check after test completion...${RESET}"
    perform_health_check "$ARTILLERY_TARGET" "Final Post-Test"
else
    echo ""
    echo -e "${RED}❌ Artillery test failed with exit code: $artillery_exit_code${RESET}"
    echo ""
    
    # Still perform health check even on failure
    echo -e "\n${CYAN}🔍 Performing health check after test failure...${RESET}"
    perform_health_check "$ARTILLERY_TARGET" "Post-Test (After Failure)"
fi
