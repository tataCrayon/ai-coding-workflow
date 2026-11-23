#!/usr/bin/env python3
"""Validate agent project against development standards."""
import os, sys, json, yaml

def check_charter(agent_dir):
    path = os.path.join(agent_dir, 'AGENT.md')
    if not os.path.isfile(path):
        return ['No AGENT.md charter found']
    with open(path, encoding='utf-8') as fh:
        content = fh.read()
    required = ['目的', '明确不做', 'owner', '自治上限', '成功', '停止', '复审']
    return ['AGENT.md missing section: ' + item for item in required if item not in content]

def check_prompt_files(agent_dir):
    issues = []
    prompt_dir = os.path.join(agent_dir, 'prompts')
    if not os.path.isdir(prompt_dir):
        return ['No prompts/ directory found']
    for f in os.listdir(prompt_dir):
        if f.endswith('.md'):
            with open(os.path.join(prompt_dir, f)) as fh:
                content = fh.read()
            if not content.startswith('---'):
                issues.append(f+': missing front-matter')
    return issues

def check_registry(agent_dir):
    rp = os.path.join(agent_dir, 'registry.yaml')
    if not os.path.isfile(rp):
        return ['No registry.yaml found']
    return []

def check_tool_schemas(agent_dir):
    issues = []
    td = os.path.join(agent_dir, 'tools')
    if not os.path.isdir(td):
        return ['No tools/ directory found']
    for f in os.listdir(td):
        if f.endswith(('.py','.ts')):
            with open(os.path.join(td,f)) as fh:
                c = fh.read().lower()
            if not any(x in c for x in ['retry','except','catch']):
                issues.append(f+': no error handling found')
    return issues

def check_golden_tests(agent_dir):
    issues = []
    gd = os.path.join(agent_dir, 'tests', 'golden')
    if not os.path.isdir(gd):
        return ['No tests/golden/ directory found']
    count = len([f for f in os.listdir(gd) if f.endswith('.json')])
    if count < 10:
        issues.append(f'Only {count} golden tests (minimum 10 required)')
    return issues

def check_tracing(agent_dir):
    issues = []
    for root, dirs, files in os.walk(os.path.join(agent_dir, 'src')):
        for f in files:
            if f.endswith(('.py','.ts')):
                with open(os.path.join(root,f)) as fh:
                    c = fh.read().lower()
                if any(x in c for x in ['span','tracer','otel']):
                    return issues
    return ['No tracing spans found in source code']

def main():
    if len(sys.argv) < 2:
        print('Usage: validate_agent_standards.py <agent-dir>'); sys.exit(1)
    ad = sys.argv[1]
    checks = {'Charter': check_charter(ad), 'Prompt files': check_prompt_files(ad), 'Registry': check_registry(ad),
             'Tool schemas': check_tool_schemas(ad), 'Golden tests': check_golden_tests(ad),
             'Tracing': check_tracing(ad)}
    total = 0
    print(f'=== Agent Standards Validation: {ad} ===')
    for name, issues in checks.items():
        status = 'PASS' if not issues else f'FAIL ({len(issues)} issues)'
        print(f'  [{status}] {name}')
        for i in issues: print(f'         - {i}'); total += 1
    if total == 0: print('Result: ALL CHECKS PASSED'); sys.exit(0)
    else: print(f'Result: {total} issue(s) found'); sys.exit(1)

if __name__ == '__main__': main()
