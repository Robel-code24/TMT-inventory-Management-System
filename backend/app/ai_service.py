import os
import json
import urllib.request
import urllib.error
from openai import OpenAI
try:
    from openai import OpenAIError
except ImportError:
    OpenAIError = Exception
from typing import List, Dict, Any, Optional
from sqlalchemy import text
from app.database import get_db
from app.config import settings

openai_client = OpenAI(
    api_key=settings.openai_api_key,
    base_url=settings.openai_api_base,
)

openai_fallback_client: Optional[OpenAI] = None
if settings.openai_fallback_api_base:
    openai_fallback_client = OpenAI(
        api_key=settings.openai_api_key,
        base_url=settings.openai_fallback_api_base,
    )

openrouter_client: Optional[OpenAI] = None
if settings.openrouter_api_base and settings.openrouter_api_key:
    openrouter_client = OpenAI(
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_api_base,
    )


def build_google_prompt(messages: List[Dict[str, str]]) -> str:
    prompt_lines = []
    for msg in messages:
        role = msg.get("role")
        content = msg.get("content", "")
        if role == "system":
            prompt_lines.append(content)
        elif role == "user":
            prompt_lines.append(f"User: {content}")
        elif role == "assistant":
            prompt_lines.append(f"Assistant: {content}")
        else:
            prompt_lines.append(content)
    return "\n\n".join(prompt_lines)


def perform_google_request(messages: List[Dict[str, str]], model: str) -> str:
    if not settings.google_api_key:
        raise ValueError("Google API key is required for AI_PROVIDER=google.")

    model_name = model
    if not model_name.startswith("models/"):
        model_name = f"models/{model_name}"

    url = f"{settings.google_api_base}/{model_name}:generateText"
    headers = {"Content-Type": "application/json"}

    if settings.google_api_key.startswith("AIza"):
        url = f"{url}?key={settings.google_api_key}"
    else:
        headers["Authorization"] = f"Bearer {settings.google_api_key}"

    prompt_text = build_google_prompt(messages)
    body = {
        "prompt": {"text": prompt_text},
        "temperature": 0.7,
        "maxOutputTokens": 500,
    }
    request_data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=request_data,
        headers=headers,
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            payload = json.load(resp)
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="ignore")
        try:
            payload = json.loads(error_body)
            message = payload.get("error", {}).get("message", error_body)
        except Exception:
            message = error_body
        raise Exception(f"Google Studio API error {e.code}: {message}")
    except urllib.error.URLError as e:
        raise Exception(f"Google Studio request failed: {e.reason}")

    candidates = payload.get("candidates") or []
    if candidates and isinstance(candidates, list):
        return candidates[0].get("output", "")

    raise Exception("Google Studio response did not return any text output.")


def format_ai_error(error: Exception) -> str:
    message = str(error)

    if isinstance(error, OpenAIError) and hasattr(error, "response") and error.response is not None:
        try:
            payload = error.response.json()
            if isinstance(payload, dict):
                err = payload.get("error", payload)
                if isinstance(err, dict):
                    message = err.get("message", message)
                    if err.get("type"):
                        message = f"{err['type']}: {message}"
        except Exception:
            pass

    if "telegram_required" in message.lower():
        return (
            "AI Error: NoraRouter rejected the request because the current route requires Telegram binding. "
            "Please use a different NoraRouter API key/route or switch to another provider."
        )

    return f"AI Error: {message}"


def perform_chat_request(client_obj: OpenAI, messages: List[Dict[str, str]], model: str) -> str:
    response = client_obj.chat.completions.create(
        model=model,
        messages=messages,
        temperature=0.7,
        max_tokens=500,
    )
    return response.choices[0].message.content


def get_effective_provider() -> str:
    provider = os.getenv("AI_PROVIDER", settings.ai_provider).lower()
    if provider not in {"openai", "google", "openrouter"}:
        provider = "openai"
    if provider == "openai" and settings.google_api_key:
        provider = "google"
    return provider


def perform_openrouter_request(messages: List[Dict[str, str]], model: str) -> str:
    if not settings.openrouter_api_key or not settings.openrouter_api_base:
        raise ValueError("OpenRouter API key and base URL are required for AI_PROVIDER=openrouter.")

    base_url = settings.openrouter_api_base.rstrip("/")
    url = f"{base_url}/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.openrouter_api_key}",
    }
    body = {
        "model": model,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 500,
    }

    request_data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=request_data,
        headers=headers,
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            payload = json.load(resp)
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="ignore")
        try:
            payload = json.loads(error_body)
            message = payload.get("error", {}).get("message", error_body)
        except Exception:
            message = error_body
        raise Exception(f"OpenRouter API error {e.code}: {message}")
    except urllib.error.URLError as e:
        raise Exception(f"OpenRouter request failed: {e.reason}")

    choices = payload.get("choices") or []
    if choices and isinstance(choices, list):
        return choices[0].get("message", {}).get("content", "")

    raise Exception("OpenRouter response did not return any text output.")


def perform_ai_request(messages: List[Dict[str, str]], model: str) -> str:
    provider = get_effective_provider()
    if provider == "google":
        return perform_google_request(messages, settings.google_model)
    if provider == "openrouter":
        return perform_openrouter_request(messages, settings.openrouter_model)
    return perform_chat_request(openai_client, messages, model)


def should_retry_on_fallback(error: Exception) -> bool:
    message = str(error).lower()
    return "telegram_required" in message or "forbidden" in message


def should_fallback_openrouter(error: Exception) -> bool:
    message = str(error).lower()
    return (
        "error code: 1010" in message
        or "insufficient credits" in message
        or "never purchased credits" in message
    )

SYSTEM_PROMPT = """You are an AI assistant for TMT InventoryPro, an inventory management system. 
You help users with:
1. Inventory insights - analyzing inventory data, predicting stock needs, identifying trends
2. Customer support - answering questions about the app, helping with navigation
3. Data analysis - generating reports, answering questions about inventory data
4. Task automation - helping with common tasks like adding items, updating stock

Be concise, helpful, and professional. When analyzing data, provide specific insights and actionable recommendations.
When helping with tasks, guide users through the process step by step."""

def get_inventory_context() -> str:
    """Fetch current inventory data to provide context to the AI."""
    try:
        db = next(get_db())
        result = db.execute(text("""
            SELECT name, category, quantity, unit, min_stock_level, price 
            FROM items 
            ORDER BY quantity ASC 
            LIMIT 20
        """))
        items = result.fetchall()
        
        if not items:
            return "No inventory data available yet."
        
        context = "Current Inventory (lowest stock first):\n"
        for item in items:
            status = "LOW STOCK" if item.quantity <= item.min_stock_level else "OK"
            context += f"- {item.name} ({item.category}): {item.quantity} {item.unit} | Price: ${item.price} | Status: {status}\n"
        
        return context
    except Exception as e:
        return f"Error fetching inventory data: {str(e)}"

def chat_with_ai(message: str, conversation_history: List[Dict[str, str]] = None) -> str:
    """Send a message to the AI and get a response."""
    if conversation_history is None:
        conversation_history = []
    
    # Add inventory context to the system prompt
    inventory_context = get_inventory_context()
    enhanced_system_prompt = f"{SYSTEM_PROMPT}\n\n{inventory_context}"
    
    # Build messages array
    messages = [{"role": "system", "content": enhanced_system_prompt}]
    
    # Add conversation history
    for msg in conversation_history[-10:]:  # Keep last 10 messages for context
        messages.append({"role": msg["role"], "content": msg["content"]})
    
    # Add current message
    messages.append({"role": "user", "content": message})
    
    try:
        return perform_ai_request(messages, settings.openai_model)
    except Exception as e:
        if settings.ai_provider.lower() == "openrouter" and should_fallback_openrouter(e):
            try:
                return perform_chat_request(openai_client, messages, settings.openai_model)
            except Exception as fallback_error:
                return format_ai_error(fallback_error)

        if settings.ai_provider.lower() == "openai" and openai_fallback_client and should_retry_on_fallback(e):
            try:
                return perform_chat_request(
                    openai_fallback_client,
                    messages,
                    settings.openai_fallback_model or settings.openai_model,
                )
            except Exception as fallback_error:
                return format_ai_error(fallback_error)
        return format_ai_error(e)

def analyze_inventory_trends() -> str:
    """Analyze inventory trends and provide insights."""
    try:
        db = next(get_db())
        
        # Get category-wise analysis
        result = db.execute(text("""
            SELECT category, COUNT(*) as item_count, SUM(quantity) as total_quantity, AVG(price) as avg_price
            FROM items
            GROUP BY category
        """))
        categories = result.fetchall()
        
        # Get low stock items
        low_stock = db.execute(text("""
            SELECT name, quantity, min_stock_level
            FROM items
            WHERE quantity <= min_stock_level
            ORDER BY (min_stock_level - quantity) DESC
            LIMIT 10
        """))
        low_stock_items = low_stock.fetchall()
        
        # Get high value items
        high_value = db.execute(text("""
            SELECT name, quantity, price, (quantity * price) as total_value
            FROM items
            ORDER BY total_value DESC
            LIMIT 5
        """))
        high_value_items = high_value.fetchall()
        
        analysis = "📊 INVENTORY ANALYSIS REPORT\n\n"
        
        analysis += "📦 Category Overview:\n"
        for cat in categories:
            analysis += f"- {cat.category}: {cat.item_count} items, Total Qty: {cat.total_quantity}, Avg Price: ${cat.avg_price:.2f}\n"
        
        analysis += "\n⚠️ Low Stock Alerts (Restock Needed):\n"
        if low_stock_items:
            for item in low_stock_items:
                needed = item.min_stock_level - item.quantity
                analysis += f"- {item.name}: {item.quantity} units (Need {needed} more to reach min stock)\n"
        else:
            analysis += "All items are well-stocked!\n"
        
        analysis += "\n💰 High Value Items:\n"
        for item in high_value_items:
            analysis += f"- {item.name}: {item.quantity} units @ ${item.price} each (Total: ${item.total_value:.2f})\n"
        
        # Get AI insights
        ai_insights = chat_with_ai("Based on the inventory data, provide 3-5 actionable insights and recommendations for improving inventory management.")
        
        analysis += "\n🤖 AI Insights:\n" + ai_insights
        
        return analysis
    except Exception as e:
        return f"Error analyzing inventory: {str(e)}"

def generate_inventory_report(report_type: str = "summary") -> str:
    """Generate different types of inventory reports."""
    try:
        db = next(get_db())
        
        if report_type == "summary":
            result = db.execute(text("""
                SELECT 
                    COUNT(*) as total_items,
                    SUM(quantity) as total_quantity,
                    SUM(quantity * price) as total_value,
                    AVG(price) as avg_price
                FROM items
            """))
            summary = result.fetchone()
            
            report = f"""
📋 INVENTORY SUMMARY REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Items: {summary.total_items}
Total Quantity: {summary.total_quantity or 0}
Total Value: ${summary.total_value or 0:.2f}
Average Price: ${summary.avg_price or 0:.2f}
            """
            
            ai_analysis = chat_with_ai("Provide a brief analysis of this inventory summary and suggest any areas that need attention.")
            report += f"\n\n🤖 Analysis:\n{ai_analysis}"
            
            return report
        
        elif report_type == "low_stock":
            result = db.execute(text("""
                SELECT name, category, quantity, min_stock_level, price
                FROM items
                WHERE quantity <= min_stock_level
                ORDER BY quantity ASC
            """))
            items = result.fetchall()
            
            if not items:
                return "✅ No items are currently low on stock!"
            
            report = "⚠️ LOW STOCK REPORT\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            for item in items:
                needed = item.min_stock_level - item.quantity
                report += f"{item.name} ({item.category}): {item.quantity}/{item.min_stock_level} units - Need {needed} more\n"
            
            return report
        
        elif report_type == "categories":
            result = db.execute(text("""
                SELECT category, COUNT(*) as count, SUM(quantity) as total_qty, SUM(quantity * price) as total_value
                FROM items
                GROUP BY category
                ORDER BY total_value DESC
            """))
            categories = result.fetchall()
            
            report = "📁 CATEGORY REPORT\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            for cat in categories:
                report += f"{cat.category}: {cat.count} items, {cat.total_qty} units, ${cat.total_value:.2f} value\n"
            
            return report
        
        else:
            return "Invalid report type. Available: summary, low_stock, categories"
            
    except Exception as e:
        return f"Error generating report: {str(e)}"

def suggest_task(task_description: str) -> Dict[str, Any]:
    """Provide guidance for common inventory tasks."""
    task_guidance = {
        "add_item": {
            "steps": [
                "Go to the Dashboard",
                "Click 'Add Item' button",
                "Fill in the item details (name, category, quantity, unit, price)",
                "Set minimum stock level for alerts",
                "Click 'Save' to add the item"
            ],
            "tips": "Use consistent naming conventions and categories for better organization."
        },
        "update_stock": {
            "steps": [
                "Navigate to Inventory page",
                "Find the item you want to update",
                "Click 'Edit' on the item",
                "Update the quantity",
                "Click 'Save' to confirm changes"
            ],
            "tips": "Regular stock updates help maintain accurate inventory levels."
        },
        "create_report": {
            "steps": [
                "Go to Reports section",
                "Select the type of report you need",
                "Choose date range if applicable",
                "Click 'Generate Report'",
                "Export or print the report as needed"
            ],
            "tips": "Generate reports weekly or monthly for better inventory tracking."
        }
    }
    
    # Use AI to understand the task and provide customized guidance
    ai_response = chat_with_ai(f"User wants to: {task_description}. Provide step-by-step guidance for this task in the TMT InventoryPro app.")
    
    return {
        "ai_guidance": ai_response,
        "common_tasks": task_guidance
    }
