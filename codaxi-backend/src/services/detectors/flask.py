import ast
from typing import List, Dict

def detect_flask(file_path: str, code: str) -> List[Dict]:
    out: List[Dict] = []
    try:
        tree = ast.parse(code)
    except Exception:
        return out

    class Visitor(ast.NodeVisitor):
        def visit_Call(self, node: ast.Call):
            # @app.route('/path', methods=['GET','POST'])
            try:
                func = node.func
                if isinstance(func, ast.Attribute) and func.attr == 'route':
                    # first arg: path; methods kw
                    path = None
                    if node.args and isinstance(node.args[0], ast.Str):
                        path = node.args[0].s
                    methods = ['get']
                    for kw in node.keywords:
                        if kw.arg == 'methods' and isinstance(kw.value, (ast.List, ast.Tuple)):
                            methods = [getattr(x, 's', '').lower() for x in kw.value.elts if isinstance(x, ast.Str)] or methods
                    if path:
                        for m in methods:
                            out.append({
                                'method': m,
                                'path': path,
                                'citations': [{ 'filePath': file_path, 'startLine': node.lineno, 'endLine': getattr(node, 'end_lineno', node.lineno) }],
                                'metadata': { 'framework': 'flask' }
                            })
            finally:
                self.generic_visit(node)

    Visitor().visit(tree)
    return out


