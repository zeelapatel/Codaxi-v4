import ast
from typing import List, Dict

def detect_django_urls(file_path: str, code: str) -> List[Dict]:
    out: List[Dict] = []
    try:
        tree = ast.parse(code)
    except Exception:
        return out

    class Visitor(ast.NodeVisitor):
        def visit_Assign(self, node: ast.Assign):
            # urlpatterns = [ path('x', view), re_path(r'^y$', view) ]
            try:
                if not isinstance(node.value, (ast.List, ast.Tuple)):
                    return
                for elt in getattr(node.value, 'elts', []):
                    if isinstance(elt, ast.Call) and isinstance(elt.func, ast.Name) and elt.func.id in ('path','re_path'):
                        if elt.args and isinstance(elt.args[0], ast.Str):
                            p = elt.args[0].s
                            out.append({'method': 'get', 'path': '/' + p.strip('/'), 'citations': [{ 'filePath': file_path, 'startLine': elt.lineno, 'endLine': getattr(elt, 'end_lineno', elt.lineno)}], 'metadata': {'framework':'django'}})
            finally:
                self.generic_visit(node)

    Visitor().visit(tree)
    return out


