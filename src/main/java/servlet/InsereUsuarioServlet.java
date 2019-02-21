/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package servlet;

import java.io.IOException;
import java.io.PrintWriter;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import model.Usuario;
import dao.UsuarioDAO;
/**
 *
 * @author eduardo
 */
@WebServlet(name = "InsereUsuarioServlet", urlPatterns = {"/InsereUsuarioServlet"})
public class InsereUsuarioServlet extends HttpServlet {

    @Override
    protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        
        Usuario usuario = new Usuario();
        
        usuario.setNome(req.getParameter("nome"));
        usuario.setSenha(req.getParameter("senha"));
        usuario.setEmail(req.getParameter("email"));
        
        UsuarioDAO dao = new UsuarioDAO();
        dao.inserir(usuario);
        
        PrintWriter out = resp.getWriter();
        out.println("Cadastro realizado com sucesso!");
        
    }
    
}
