---
date: 2022-04-19 20:00:00
authors: [gaoliang]
tags: [java,maven]
---
# Maven Shade Plugin 的使用

[Maven Shade Plugin](https://maven.apache.org/plugins/maven-shade-plugin/) 是 Maven 官方提供的一个运行在 `package` 阶段的打包插件，其目的是打包一个 Uber-Jar，同时他还提供了重命名依赖的功能，可以用于解决依赖冲突问题。

<!--truncate-->


## 功能1: 打包 Uber Jar

Uber-Jar 也被称为 Fat Jar, Uber 这个单词来自于德语 Über，其含义与英语中的 over 类似，Uber-Jar 是一种打包了依赖的 Jar

Maven 在 Package 阶段会默认执行 jar 插件的 jar 命令，将已编译的 class 字节码文件以及 resource 路径下的资源文件，打包为 jar 文件。需要注意的时，此时打包的 jar 文件是不包含依赖的

可以做个实验来验证这一点，首先创建一个不需要任何三方依赖的 Maven 项目，创建一个测试用的主类，并配置 jar 的入口类。

测试类:
```java
package me.gaoliang.maven;

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World");
    }
}
```

pom.xml 配置 jar 清单主入口类:
```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-jar-plugin</artifactId>
            <version>3.2.2</version>
            <configuration>
                <archive>
                    <manifest>
                        <mainClass>me.gaoliang.maven.Main</mainClass>
                    </manifest>
                </archive>
            </configuration>
        </plugin>
    </plugins>
</build>
```

执行`maven clean package` 构建 jar，可以正常执行 jar 
```shell
java -jar maven-example-1.0-SNAPSHOT.jar 
Hello World
```

但是当在 POM 中配置了第三方依赖，例如引用了大名鼎鼎的 `guava`，重新 `maven clean package`打包 jar 并运行，此时会报错 
```java
package me.gaoliang.maven;
import com.google.common.base.Strings;

public class Main {
    public static void main(String[] args) {
        System.out.println(Strings.nullToEmpty("Hello World"));
    }
}
```
```xml
<dependencies>
    <dependency>
        <groupId>com.google.guava</groupId>
        <artifactId>guava</artifactId>
        <version>30.1.1-jre</version>
    </dependency>
</dependencies>

<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-jar-plugin</artifactId>
            <version>3.2.2</version>
            <configuration>
                <archive>
                    <manifest>
                        <mainClass>me.gaoliang.maven.Main</mainClass>
                    </manifest>
                </archive>
            </configuration>
        </plugin>
    </plugins>
</build>

```

```shell
java -jar maven-example-1.0-SNAPSHOT.jar 
Exception in thread "main" java.lang.NoClassDefFoundError: com/google/common/base/Strings
        at me.gaoliang.maven.Main.main(Main.java:11)
Caused by: java.lang.ClassNotFoundException: com.google.common.base.Strings
        at java.net.URLClassLoader.findClass(URLClassLoader.java:382)
        at java.lang.ClassLoader.loadClass(ClassLoader.java:418)
        at sun.misc.Launcher$AppClassLoader.loadClass(Launcher.java:352)
        at java.lang.ClassLoader.loadClass(ClassLoader.java:351)
        ... 1 more
```

可见 maven 默认的 package 阶段是不会打包依赖的

向刚才报错的 POM 文件中加入 maven-shade-plugin，并且将插件提供的 goal 绑定到 package 阶段
```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-shade-plugin</artifactId>
    <version>3.2.4</version>
    <executions>
        <execution>
            <!-- 和 package 阶段绑定 -->
            <phase>package</phase>
            <goals>
                <goal>shade</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```
重新运行 `maven clean package`，可以发现 target 目录下生成了两个 jar 文件， maven-example-1.0-SNAPSHOT.jar 和 original-maven-example-1.0-SNAPSHOT.jar。 其中不包含 original 的 jar 文件，就是被 shade 插件修改过的，包含有依赖的 jar，可以正常运行。 


## 功能2: “重命名” 类以解决依赖冲突问题
TODO


## 参考
- [Apache Maven Shade Plugin](https://maven.apache.org/plugins/maven-shade-plugin/)
- [What is an uber jar?](https://stackoverflow.com/a/11947093/6925790)
