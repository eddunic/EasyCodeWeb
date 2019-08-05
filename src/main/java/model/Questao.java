package model;

import java.io.Serializable;
import javax.persistence.*;

/**
 *
 * @author eduardo
 */

@Entity
public class Questao implements Serializable {
    
    @Id
    private Long id;
    
    private String nome;
    
    private String enunciado;
    
    private String codigoFonte;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getEnunciado() {
        return enunciado;
    }

    public void setEnunciado(String enunciado) {
        this.enunciado = enunciado;
    }

    public String getCodigoFonte() {
        return codigoFonte;
    }

    public void setCodigoFonte(String codigoFonte) {
        this.codigoFonte = codigoFonte;
    }
    
}
