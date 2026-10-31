"""Writes a coverage table to the GitHub Actions job summary.

Usage:
  python coverage_summary.py jacoco backend/target/site/jacoco/jacoco.csv
  python coverage_summary.py vitest frontend/coverage/frontend/coverage-summary.json
"""
import csv
import json
import os
import sys

JACOCO_COUNTERS = [("LINE", "Líneas"), ("BRANCH", "Ramas"), ("INSTRUCTION", "Instrucciones"), ("METHOD", "Métodos")]
VITEST_COUNTERS = [("lines", "Líneas"), ("branches", "Ramas"), ("statements", "Sentencias"), ("functions", "Funciones")]


def jacoco(path):
    rows = list(csv.DictReader(open(path, encoding="utf-8")))
    result = []
    for counter, label in JACOCO_COUNTERS:
        missed = sum(int(row[f"{counter}_MISSED"]) for row in rows)
        covered = sum(int(row[f"{counter}_COVERED"]) for row in rows)
        result.append((label, covered, missed + covered))
    return "Backend (JaCoCo)", result


def vitest(path):
    total = json.load(open(path, encoding="utf-8"))["total"]
    return "Frontend (Vitest)", [(label, total[key]["covered"], total[key]["total"]) for key, label in VITEST_COUNTERS]


def main():
    kind, path = sys.argv[1], sys.argv[2]
    title, counters = {"jacoco": jacoco, "vitest": vitest}[kind](path)
    lines = [f"### Cobertura — {title}", "", "| Métrica | Cubierto | Total | % |", "|---|---:|---:|---:|"]
    for label, covered, total in counters:
        percent = 100 * covered / total if total else 100
        lines.append(f"| {label} | {covered} | {total} | {percent:.1f} % |")
    report = "\n".join(lines) + "\n"
    print(report)
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as output:
            output.write(report)


if __name__ == "__main__":
    main()
