/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package dao;

import model.Usuario;
import org.hibernate.Session;
import util.HibernateUtil;

/**
 *
 * @author eduardo
 */
public class UsuarioDAO {
    
    public void inserir(Usuario usuario) {
        //cria e abre sessao
        Session s = HibernateUtil.getSessionFactory().openSession();
        //inicia transacao
        s.beginTransaction();
        
        //insere
        s.persist(usuario);
        
        //commita
        s.getTransaction().commit();
        
        //libera memoria
        s.flush();
        //fecha sessao
        s.close();
    }
    
}
